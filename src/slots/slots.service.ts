import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slot, SlotStatus } from './slot.entity';
import { RecurringAvailability, DayOfWeek } from '../doctor/availability/recurring-availability.entity';
import { CustomAvailability } from '../doctor/availability/custom-availability.entity';
import { User } from '../user.entity';
import { GenerateSlotsDto } from './dto/slot.dto';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,
    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,
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
      throw new BadRequestException('Cannot generate slots for a past date');
    }
  }

  // ─── Generate slots from availability windows ────────────────────────────────

  private generateSlotsFromWindows(
    windows: { startTime: string; endTime: string }[],
    durationMinutes: number,
  ): { startTime: string; endTime: string }[] {
    const slots: { startTime: string; endTime: string }[] = [];
    for (const window of windows) {
      let current = this.toMinutes(window.startTime);
      const end = this.toMinutes(window.endTime);
      while (current + durationMinutes <= end) {
        slots.push({
          startTime: this.toTimeString(current),
          endTime: this.toTimeString(current + durationMinutes),
        });
        current += durationMinutes;
      }
    }
    return slots;
  }

  // ─── Doctor: Generate & save slots ──────────────────────────────────────────

  async generateSlots(doctorId: string, dto: GenerateSlotsDto) {
    this.validateDate(dto.date);

    if (![5, 10, 15, 20, 30, 45, 60, 90, 120].includes(dto.durationMinutes)) {
      throw new BadRequestException(
        'durationMinutes must be one of: 5, 10, 15, 20, 30, 45, 60, 90, 120',
      );
    }

    // Check custom override first, else fall back to recurring
    const customSlots = await this.customRepo.find({
      where: { doctorId, date: dto.date },
    });

    let windows: { startTime: string; endTime: string }[] = [];
    let source = 'recurring';

    if (customSlots.length > 0) {
      windows = customSlots.map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
      source = 'custom_override';
    } else {
      const dayNames = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
      const dayOfWeek = dayNames[new Date(dto.date).getDay()] as DayOfWeek;
      const recurring = await this.recurringRepo.find({
        where: { doctorId, dayOfWeek },
      });
      if (recurring.length === 0) {
        return {
          message: 'No availability found for this date',
          source: 'none',
          date: dto.date,
          slots: [],
        };
      }
      windows = recurring.map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
    }

    // Generate slot times
    const generatedSlots = this.generateSlotsFromWindows(windows, dto.durationMinutes);

    if (generatedSlots.length === 0) {
      throw new BadRequestException(
        `No slots can be generated — duration ${dto.durationMinutes} min is too long for available windows`,
      );
    }

    // Delete existing unbooked slots for this date (regenerate)
    await this.slotRepo.delete({ doctorId, date: dto.date, status: SlotStatus.AVAILABLE });

    // Save new slots
    const saved = await this.slotRepo.save(
      generatedSlots.map((s) =>
        this.slotRepo.create({
          doctorId,
          date: dto.date,
          startTime: s.startTime,
          endTime: s.endTime,
          durationMinutes: dto.durationMinutes,
          status: SlotStatus.AVAILABLE,
        }),
      ),
    );

    return {
      message: `${saved.length} slots generated successfully`,
      source,
      date: dto.date,
      durationMinutes: dto.durationMinutes,
      slots: saved.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
      })),
    };
  }

  // ─── Patient: Get available slots for a doctor on a date ────────────────────

  async getAvailableSlots(doctorId: string, date: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date query param must be YYYY-MM-DD');
    }

    // Check doctor exists
    const doctor = await this.userRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      throw new BadRequestException('Cannot fetch slots for a past date');
    }

    const allSlots = await this.slotRepo.find({
      where: { doctorId, date, status: SlotStatus.AVAILABLE },
      order: { startTime: 'ASC' },
    });

    // Filter out past slots if date is today
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const futureSlots = allSlots.filter((slot) => {
      if (date === today) {
        return this.toMinutes(slot.startTime) > currentMinutes;
      }
      return true;
    });

    if (futureSlots.length === 0) {
      return {
        message: 'No available slots for this date',
        doctorId,
        date,
        slots: [],
      };
    }

    return {
      doctorId,
      doctorName: doctor.name,
      date,
      totalSlots: futureSlots.length,
      slots: futureSlots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
      })),
    };
  }
}
