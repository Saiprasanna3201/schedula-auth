import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability, DayOfWeek } from './recurring-availability.entity';
import { CustomAvailability } from './custom-availability.entity';
import { CreateRecurringAvailabilityDto, UpdateRecurringAvailabilityDto } from './dto/recurring-availability.dto';
import { CreateCustomAvailabilityDto } from './dto/custom-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (this.toMinutes(startTime) >= this.toMinutes(endTime)) {
      throw new BadRequestException('startTime must be before endTime');
    }
  }

  private timesOverlap(
    aStart: string, aEnd: string,
    bStart: string, bEnd: string,
  ): boolean {
    return (
      this.toMinutes(aStart) < this.toMinutes(bEnd) &&
      this.toMinutes(bStart) < this.toMinutes(aEnd)
    );
  }

  // ─── Recurring Availability ─────────────────────────────────────────────────

  async createRecurring(doctorId: string, dto: CreateRecurringAvailabilityDto) {
    this.validateTimeRange(dto.startTime, dto.endTime);

    // Check for overlapping slots on same day
    const existing = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek: dto.dayOfWeek },
    });

    for (const slot of existing) {
      if (this.timesOverlap(dto.startTime, dto.endTime, slot.startTime, slot.endTime)) {
        throw new BadRequestException(
          `Time slot overlaps with existing slot ${slot.startTime}–${slot.endTime} on ${dto.dayOfWeek}`,
        );
      }
      // Duplicate check
      if (slot.startTime === dto.startTime && slot.endTime === dto.endTime) {
        throw new BadRequestException('Duplicate availability slot');
      }
    }

    const slot = this.recurringRepo.create({ doctorId, ...dto });
    return this.recurringRepo.save(slot);
  }

  async getRecurring(doctorId: string) {
    return this.recurringRepo.find({
      where: { doctorId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateRecurring(
    doctorId: string,
    id: string,
    dto: UpdateRecurringAvailabilityDto,
  ) {
    const slot = await this.recurringRepo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Availability slot not found');
    if (slot.doctorId !== doctorId) throw new ForbiddenException('Access denied');

    const newStart = dto.startTime ?? slot.startTime;
    const newEnd = dto.endTime ?? slot.endTime;
    const newDay = dto.dayOfWeek ?? slot.dayOfWeek;

    this.validateTimeRange(newStart, newEnd);

    // Check overlaps excluding current slot
    const others = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek: newDay },
    });

    for (const other of others) {
      if (other.id === id) continue;
      if (this.timesOverlap(newStart, newEnd, other.startTime, other.endTime)) {
        throw new BadRequestException(
          `Updated slot overlaps with ${other.startTime}–${other.endTime}`,
        );
      }
    }

    Object.assign(slot, { startTime: newStart, endTime: newEnd, dayOfWeek: newDay });
    return this.recurringRepo.save(slot);
  }

  async deleteRecurring(doctorId: string, id: string) {
    const slot = await this.recurringRepo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Availability slot not found');
    if (slot.doctorId !== doctorId) throw new ForbiddenException('Access denied');
    await this.recurringRepo.remove(slot);
    return { message: 'Availability slot deleted successfully' };
  }

  // ─── Custom Override ────────────────────────────────────────────────────────

  async createOverride(doctorId: string, dto: CreateCustomAvailabilityDto) {
    this.validateTimeRange(dto.startTime, dto.endTime);

    // Validate date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (dto.date < today) {
      throw new BadRequestException('Cannot set availability for a past date');
    }

    // Check for overlaps on same date
    const existing = await this.customRepo.find({
      where: { doctorId, date: dto.date },
    });

    for (const slot of existing) {
      if (this.timesOverlap(dto.startTime, dto.endTime, slot.startTime, slot.endTime)) {
        throw new BadRequestException(
          `Time slot overlaps with existing override ${slot.startTime}–${slot.endTime} on ${dto.date}`,
        );
      }
      if (slot.startTime === dto.startTime && slot.endTime === dto.endTime) {
        throw new BadRequestException('Duplicate override slot for this date');
      }
    }

    const override = this.customRepo.create({ doctorId, ...dto });
    return this.customRepo.save(override);
  }

  async getAvailabilityForDate(doctorId: string, date: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date query param must be YYYY-MM-DD');
    }

    // Check if custom override exists for this date
    const customSlots = await this.customRepo.find({
      where: { doctorId, date },
      order: { startTime: 'ASC' },
    });

    if (customSlots.length > 0) {
      return {
        source: 'custom_override',
        date,
        slots: customSlots.map((s) => ({ id: s.id, startTime: s.startTime, endTime: s.endTime })),
      };
    }

    // Fall back to recurring availability for day of week
    const dayNames = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    const dayOfWeek = dayNames[new Date(date).getDay()] as DayOfWeek;

    const recurringSlots = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek },
      order: { startTime: 'ASC' },
    });

    return {
      source: 'recurring',
      date,
      dayOfWeek,
      slots: recurringSlots.map((s) => ({ id: s.id, startTime: s.startTime, endTime: s.endTime })),
    };
  }
}
