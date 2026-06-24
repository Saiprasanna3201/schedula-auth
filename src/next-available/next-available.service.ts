import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSchedulingConfig, SchedulingType } from '../scheduling/scheduling-config.entity';
import { WaveBooking } from '../scheduling/wave-booking.entity';
import { RecurringAvailability, DayOfWeek } from '../doctor/availability/recurring-availability.entity';
import { CustomAvailability } from '../doctor/availability/custom-availability.entity';
import { Slot, SlotStatus } from '../slots/slot.entity';
import { User } from '../user.entity';
import { Role } from '../common/types';
import { NextAvailableQueryDto } from './dto/next-available.dto';

interface StreamSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

interface WaveWindow {
  windowStart: string;
  windowEnd: string;
  maxCapacity: number;
  booked: number;
  available: number;
}

interface DayAvailability {
  hasAvailability: boolean;
  slots?: StreamSlot[];
  windows?: WaveWindow[];
}

@Injectable()
export class NextAvailableService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(DoctorSchedulingConfig)
    private readonly configRepo: Repository<DoctorSchedulingConfig>,

    @InjectRepository(Slot)
    private readonly slotRepo: Repository<Slot>,

    @InjectRepository(WaveBooking)
    private readonly waveBookingRepo: Repository<WaveBooking>,

    @InjectRepository(RecurringAvailability)
    private readonly recurringRepo: Repository<RecurringAvailability>,

    @InjectRepository(CustomAvailability)
    private readonly customRepo: Repository<CustomAvailability>,
  ) {}

  async findNextAvailable(dto: NextAvailableQueryDto) {
    const doctor = await this.userRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor || doctor.role !== Role.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }

    const config = await this.configRepo.findOne({ where: { doctorId: dto.doctorId } });
    if (!config) {
      throw new BadRequestException('Doctor has not configured a scheduling type yet.');
    }

    const maxDays = dto.searchDays ?? 30;

    const today = this.getDateString(new Date());
    const todayResult = await this.checkDayAvailability(dto.doctorId, today, config);

    if (todayResult.hasAvailability) {
      return this.buildResponse(today, config.schedulingType, todayResult, doctor.name);
    }

    let workingDaysChecked = 0;
    const cursor = new Date();
    cursor.setDate(cursor.getDate() + 1);

    while (workingDaysChecked < maxDays) {
      const dateStr = this.getDateString(cursor);
      const isWorkingDay = await this.isDoctorWorkingDay(dto.doctorId, dateStr);

      if (isWorkingDay) {
        const result = await this.checkDayAvailability(dto.doctorId, dateStr, config);
        if (result.hasAvailability) {
          return this.buildResponse(dateStr, config.schedulingType, result, doctor.name);
        }
        workingDaysChecked++;
      }

      cursor.setDate(cursor.getDate() + 1);

      if (this.daysBetween(new Date(), cursor) > 90) break;
    }

    return {
      message: `No appointments available in the next ${maxDays} working days. Please try again later.`,
      doctorId: dto.doctorId,
      doctorName: doctor.name,
      schedulingType: config.schedulingType,
      available: false,
    };
  }

  private async checkDayAvailability(
    doctorId: string,
    date: string,
    config: DoctorSchedulingConfig,
  ): Promise<DayAvailability> {
    if (config.schedulingType === SchedulingType.STREAM) {
      return this.checkStreamDay(doctorId, date);
    } else {
      return this.checkWaveDay(doctorId, date, config);
    }
  }

  private async checkStreamDay(doctorId: string, date: string): Promise<DayAvailability> {
    const availableSlots = await this.slotRepo.find({
      where: { doctorId, date, status: SlotStatus.AVAILABLE },
      order: { startTime: 'ASC' },
    });

    const today = this.getDateString(new Date());
    const filtered = date === today
      ? availableSlots.filter((s) => this.isFutureTime(s.startTime))
      : availableSlots;

    if (filtered.length === 0) return { hasAvailability: false };

    return {
      hasAvailability: true,
      slots: filtered.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
      })),
    };
  }

  private async checkWaveDay(
    doctorId: string,
    date: string,
    config: DoctorSchedulingConfig,
  ): Promise<DayAvailability> {
    const windows = await this.getAvailabilityWindows(doctorId, date);
    if (windows.length === 0) return { hasAvailability: false };

    const waveWindows: WaveWindow[] = await Promise.all(
      windows.map(async (w) => {
        const bookedCount = await this.waveBookingRepo.count({
          where: { doctorId, date, windowStart: w.startTime, windowEnd: w.endTime },
        });
        return {
          windowStart: w.startTime,
          windowEnd: w.endTime,
          maxCapacity: config.maxPatientsPerWindow!,
          booked: bookedCount,
          available: config.maxPatientsPerWindow! - bookedCount,
        };
      }),
    );

    const today = this.getDateString(new Date());
    const availableWindows = waveWindows.filter((w) => {
      if (w.available <= 0) return false;
      if (date === today && !this.isFutureTime(w.windowStart)) return false;
      return true;
    });

    if (availableWindows.length === 0) return { hasAvailability: false };

    return { hasAvailability: true, windows: availableWindows };
  }

  private async isDoctorWorkingDay(doctorId: string, date: string): Promise<boolean> {
    const custom = await this.customRepo.find({ where: { doctorId, date } });
    if (custom.length > 0) return true;

    const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = DAY_NAMES[new Date(date).getDay()] as DayOfWeek;
    const recurring = await this.recurringRepo.find({ where: { doctorId, dayOfWeek } });
    return recurring.length > 0;
  }

  private async getAvailabilityWindows(doctorId: string, date: string) {
    const custom = await this.customRepo.find({ where: { doctorId, date } });
    if (custom.length > 0) {
      return custom.map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
    }
    const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = DAY_NAMES[new Date(date).getDay()] as DayOfWeek;
    const recurring = await this.recurringRepo.find({ where: { doctorId, dayOfWeek } });
    return recurring.map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
  }

  private buildResponse(
    date: string,
    schedulingType: SchedulingType,
    availability: DayAvailability,
    doctorName: string,
  ) {
    const isToday = date === this.getDateString(new Date());
    const base = {
      message: isToday ? 'Slots available today' : `Next available appointment found on ${date}`,
      available: true,
      date,
      schedulingType,
      doctorName,
    };

    if (schedulingType === SchedulingType.STREAM) {
      return {
        ...base,
        slots: availability.slots,
        totalAvailable: availability.slots?.length ?? 0,
        note: 'Use POST /appointments/book with the slotId to confirm booking',
      };
    } else {
      return {
        ...base,
        windows: availability.windows,
        totalWindowsAvailable: availability.windows?.length ?? 0,
        note: 'Use POST /scheduling/wave/book with windowStart and windowEnd to confirm booking',
      };
    }
  }

  private getDateString(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private isFutureTime(timeStr: string): boolean {
    const now = new Date();
    const [h, m] = timeStr.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes > nowMinutes;
  }

  private daysBetween(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }
}