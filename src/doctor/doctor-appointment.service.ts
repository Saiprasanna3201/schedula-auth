import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointment/entities/appointment.entity';
import { DoctorProfile } from './doctor-profile.entity';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';

@Injectable()
export class DoctorAppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(DoctorProfile)
    private readonly doctorRepo: Repository<DoctorProfile>,
  ) {}

  async getDoctorAppointments(userId: string, date?: string) {
    // userId comes from JWT (req.user.id) - resolve to doctor profile id
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found. Please create your profile first.');

    const where: any = { doctorId: doctor.id, status: AppointmentStatus.BOOKED };
    if (date) where.date = date;

    const appointments = await this.appointmentRepo.find({
      where,
      relations: { patient: true },
      order: { date: 'ASC', startTime: 'ASC' },
    });

    if (appointments.length === 0) {
      return {
        message: date ? `No appointments found for ${date}` : 'No appointments found',
        total: 0,
        appointments: [],
      };
    }

    const enriched = appointments.map((a) => ({
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      tokenNumber: a.tokenNumber,
      patient: a.patient
        ? { id: a.patient.id, fullName: a.patient.fullName, age: a.patient.age, gender: a.patient.gender }
        : { id: a.patientId },
      createdAt: a.createdAt,
    }));

    return {
      message: 'Appointments retrieved successfully',
      total: enriched.length,
      appointments: enriched,
    };
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found. Please create your profile first.');

    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException('You are not authorized to cancel this appointment');
    }
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    const saved = await this.appointmentRepo.save(appointment);

    return {
      message: 'Appointment cancelled successfully',
      appointment: {
        id: saved.id,
        date: saved.date,
        startTime: saved.startTime,
        endTime: saved.endTime,
        status: saved.status,
      },
    };
  }
}
