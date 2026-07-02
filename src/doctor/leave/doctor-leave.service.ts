import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorLeave } from './doctor-leave.entity';
import { DoctorProfile } from '../doctor-profile.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { CreateDoctorLeaveDto } from './dto/doctor-leave.dto';

@Injectable()
export class DoctorLeaveService {
  constructor(
    @InjectRepository(DoctorLeave)
    private readonly leaveRepo: Repository<DoctorLeave>,

    @InjectRepository(DoctorProfile)
    private readonly doctorRepo: Repository<DoctorProfile>,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async createLeave(userId: string, dto: CreateDoctorLeaveDto) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found. Please create your profile first.');

    // 1. Past date check
    const today = this.todayStr();
    if (dto.leaveDate < today) {
      throw new BadRequestException('Cannot apply leave for a past date.');
    }

    // 2. Duplicate leave check
    const existing = await this.leaveRepo.findOne({
      where: { doctorId: doctor.userId, leaveDate: dto.leaveDate },
    });
    if (existing) {
      throw new ConflictException(`Leave already exists for ${dto.leaveDate}.`);
    }

    // 3. Check for existing BOOKED appointments on that date
    const bookedCount = await this.appointmentRepo.count({
      where: {
        doctorId: doctor.id,
        date: dto.leaveDate,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (bookedCount > 0) {
      throw new ConflictException(
        `Cannot apply leave. ${bookedCount} appointment(s) are already scheduled on ${dto.leaveDate}. Please cancel or reschedule existing appointments first.`,
      );
    }

    const leave = this.leaveRepo.create({
      doctorId: doctor.userId,
      leaveDate: dto.leaveDate,
      reason: dto.reason || null,
    });

    const saved = await this.leaveRepo.save(leave);

    return {
      message: `Leave applied successfully for ${dto.leaveDate}.`,
      leave: {
        id: saved.id,
        leaveDate: saved.leaveDate,
        reason: saved.reason,
        createdAt: saved.createdAt,
      },
    };
  }

  async getMyLeaves(userId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found.');

    const leaves = await this.leaveRepo.find({
      where: { doctorId: doctor.userId },
      order: { leaveDate: 'ASC' },
    });

    if (!leaves.length) {
      return { message: 'No leaves found.', data: [] };
    }

    return {
      message: 'Leaves retrieved successfully.',
      total: leaves.length,
      data: leaves.map((l) => ({
        id: l.id,
        leaveDate: l.leaveDate,
        reason: l.reason,
        createdAt: l.createdAt,
      })),
    };
  }

  async deleteLeave(userId: string, leaveId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found.');

    const leave = await this.leaveRepo.findOne({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException('Leave not found.');

    if (leave.doctorId !== doctor.userId) {
      throw new ForbiddenException('You can only delete your own leave.');
    }

    const today = this.todayStr();
    if (leave.leaveDate < today) {
      throw new BadRequestException('Cannot delete a past leave.');
    }

    await this.leaveRepo.remove(leave);
    return { message: `Leave for ${leave.leaveDate} deleted successfully.` };
  }

  // Used by appointment booking service to check if doctor is on leave
  async isOnLeave(doctorUserId: string, date: string): Promise<boolean> {
    const leave = await this.leaveRepo.findOne({
      where: { doctorId: doctorUserId, leaveDate: date },
    });
    return !!leave;
  }

  private todayStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  }
}
