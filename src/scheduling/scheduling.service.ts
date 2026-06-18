import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSchedulingConfig, SchedulingType } from './scheduling-config.entity';
import { WaveBooking } from './wave-booking.entity';
import { RecurringAvailability, DayOfWeek } from '../doctor/availability/recurring-availability.entity';
import { CustomAvailability } from '../doctor/availability/custom-availability.entity';
import { Slot, SlotStatus } from '../slots/slot.entity';
import { User } from '../user.entity';
import { Role } from '../common/types';
import { SetSchedulingConfigDto, GenerateScheduleDto, BookWaveDto } from './dto/scheduling.dto';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(DoctorSchedulingConfig)
    private configRepo: Repository<DoctorSchedulingConfig>,
    @InjectRepository(WaveBooking)
    private waveBookingRepo: Repository<WaveBooking>,
    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,
    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private toTimeString(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private validateDate(date: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      throw new BadRequestException('Cannot generate schedule for a past date');
    }
  }

  private async getAvailabilityWindows(doctorId: string, date: string) {
    const customSlots = await this.customRepo.find({ where: { doctorId, date } });
    if (customSlots.length > 0) {
      return {
        windows: customSlots.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
        source: 'custom_override',
      };
    }
    const dayNames = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    const dayOfWeek = dayNames[new Date(date).getDay()] as DayOfWeek;
    const recurring = await this.recurringRepo.find({ where: { doctorId, dayOfWeek } });
    return {
      windows: recurring.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
      source: 'recurring',
    };
  }

  // ─── 1. Set scheduling config ───────────────────────────────────────────────

  async setSchedulingConfig(doctorId: string, dto: SetSchedulingConfigDto) {
    if (dto.schedulingType === SchedulingType.STREAM) {
      if (!dto.slotDurationMinutes) {
        throw new BadRequestException('slotDurationMinutes is required for STREAM scheduling');
      }
    }

    if (dto.schedulingType === SchedulingType.WAVE) {
      if (!dto.maxPatientsPerWindow) {
        throw new BadRequestException('maxPatientsPerWindow is required for WAVE scheduling');
      }
    }

    let config = await this.configRepo.findOne({ where: { doctorId } });

    if (config) {
      config.schedulingType = dto.schedulingType;
      config.slotDurationMinutes = dto.slotDurationMinutes ?? null;
      config.bufferMinutes = dto.bufferMinutes ?? 0;
      config.maxPatientsPerWindow = dto.maxPatientsPerWindow ?? null;
    } else {
      config = this.configRepo.create({
        doctorId,
        schedulingType: dto.schedulingType,
        slotDurationMinutes: dto.slotDurationMinutes ?? null,
        bufferMinutes: dto.bufferMinutes ?? 0,
        maxPatientsPerWindow: dto.maxPatientsPerWindow ?? null,
      });
    }

    const saved = await this.configRepo.save(config);
    return {
      message: `Scheduling type set to ${saved.schedulingType}`,
      config: saved,
    };
  }

  // ─── 2. Generate schedule (stream or wave) based on doctor's config ─────────

  async generateSchedule(doctorId: string, dto: GenerateScheduleDto) {
    this.validateDate(dto.date);

    const config = await this.configRepo.findOne({ where: { doctorId } });
    if (!config) {
      throw new BadRequestException(
        'Doctor has not configured a scheduling type yet. Set it via POST /doctor/scheduling/config',
      );
    }

    const { windows, source } = await this.getAvailabilityWindows(doctorId, dto.date);
    if (windows.length === 0) {
      return {
        message: 'No availability found for this date',
        schedulingType: config.schedulingType,
        date: dto.date,
        slots: [],
      };
    }

    if (config.schedulingType === SchedulingType.STREAM) {
      return this.generateStreamSlots(doctorId, dto.date, windows, config, source);
    } else {
      return this.generateWaveWindows(doctorId, dto.date, windows, config, source);
    }
  }

  // ─── STREAM: exact appointment slots with optional buffer ───────────────────

  private async generateStreamSlots(
    doctorId: string,
    date: string,
    windows: { startTime: string; endTime: string }[],
    config: DoctorSchedulingConfig,
    source: string,
  ) {
    const duration = config.slotDurationMinutes;
    const buffer = config.bufferMinutes || 0;
    const step = duration + buffer;

    if (duration <= 0) {
      throw new BadRequestException('Invalid slot duration configured');
    }

    const generated: { startTime: string; endTime: string }[] = [];
    for (const window of windows) {
      let current = this.toMinutes(window.startTime);
      const end = this.toMinutes(window.endTime);
      while (current + duration <= end) {
        generated.push({
          startTime: this.toTimeString(current),
          endTime: this.toTimeString(current + duration),
        });
        current += step;
      }
    }

    if (generated.length === 0) {
      throw new BadRequestException(
        'No slots can be generated — duration/buffer too long for available windows',
      );
    }

    // Regenerate: clear old available slots, insert new ones
    await this.slotRepo.delete({ doctorId, date, status: SlotStatus.AVAILABLE });
    const saved = await this.slotRepo.save(
      generated.map((s) =>
        this.slotRepo.create({
          doctorId,
          date,
          startTime: s.startTime,
          endTime: s.endTime,
          durationMinutes: duration,
          status: SlotStatus.AVAILABLE,
        }),
      ),
    );

    return {
      message: `${saved.length} stream slots generated successfully`,
      schedulingType: 'STREAM',
      source,
      date,
      slotDurationMinutes: duration,
      bufferMinutes: buffer,
      slots: saved.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
      })),
    };
  }

  // ─── WAVE: time windows with capacity ────────────────────────────────────────

  private async generateWaveWindows(
    doctorId: string,
    date: string,
    windows: { startTime: string; endTime: string }[],
    config: DoctorSchedulingConfig,
    source: string,
  ) {
    if (!config.maxPatientsPerWindow || config.maxPatientsPerWindow <= 0) {
      throw new BadRequestException('Invalid maxPatientsPerWindow configured');
    }

    const waveWindows = await Promise.all(
      windows.map(async (w) => {
        const bookedCount = await this.waveBookingRepo.count({
          where: { doctorId, date, windowStart: w.startTime, windowEnd: w.endTime },
        });
        return {
          windowStart: w.startTime,
          windowEnd: w.endTime,
          maxCapacity: config.maxPatientsPerWindow,
          booked: bookedCount,
          available: config.maxPatientsPerWindow - bookedCount,
        };
      }),
    );

    return {
      message: 'Wave schedule generated successfully',
      schedulingType: 'WAVE',
      source,
      date,
      windows: waveWindows,
    };
  }

  // ─── 3. Patient: Book a wave slot (token assignment) ─────────────────────────

  async bookWaveSlot(patientId: string, dto: BookWaveDto) {
    const doctor = await this.userRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor || doctor.role !== Role.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }

    const config = await this.configRepo.findOne({ where: { doctorId: dto.doctorId } });
    if (!config || config.schedulingType !== SchedulingType.WAVE) {
      throw new BadRequestException('This doctor does not use WAVE scheduling');
    }

    const today = new Date().toISOString().split('T')[0];
    if (dto.date < today) {
      throw new BadRequestException('Cannot book an appointment in the past');
    }

    // Check for duplicate booking by same patient in same window
    const duplicate = await this.waveBookingRepo.findOne({
      where: {
        doctorId: dto.doctorId,
        patientId,
        date: dto.date,
        windowStart: dto.windowStart,
        windowEnd: dto.windowEnd,
      },
    });
    if (duplicate) {
      throw new ConflictException('You have already booked a token in this window');
    }

    // Check capacity
    const bookedCount = await this.waveBookingRepo.count({
      where: {
        doctorId: dto.doctorId,
        date: dto.date,
        windowStart: dto.windowStart,
        windowEnd: dto.windowEnd,
      },
    });

    if (bookedCount >= config.maxPatientsPerWindow) {
      throw new ConflictException('This wave window is full. No more bookings allowed');
    }

    const tokenNumber = bookedCount + 1;

    const booking = this.waveBookingRepo.create({
      doctorId: dto.doctorId,
      patientId,
      date: dto.date,
      windowStart: dto.windowStart,
      windowEnd: dto.windowEnd,
      tokenNumber,
    });
    const saved = await this.waveBookingRepo.save(booking);

    return {
      message: 'Wave appointment booked successfully',
      booking: {
        id: saved.id,
        doctorName: doctor.name,
        date: saved.date,
        appointmentWindow: `${saved.windowStart} - ${saved.windowEnd}`,
        tokenNumber: saved.tokenNumber,
      },
    };
  }
}
