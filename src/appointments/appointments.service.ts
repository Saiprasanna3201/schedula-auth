import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { BookAppointmentDto } from './dto/appointment.dto';
import { Slot } from '../slots/slot.entity';
import { User } from '../user.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Slot)
    private readonly slotRepo: Repository<Slot>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async bookAppointment(patientId: string, dto: BookAppointmentDto) {
    const { doctorId, date, startTime, endTime } = dto;

    // 1. Future date/time check
    const slotDateTime = new Date(`${date}T${startTime}:00`);
    if (slotDateTime <= new Date()) {
      throw new BadRequestException('Cannot book appointment for a past date or time');
    }

    // 2. Doctor exists check
    const doctor = await this.userRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // 3. Slot exists and is available
    const slot = await this.slotRepo.findOne({
      where: { doctorId, date, startTime },
    });
    if (!slot) throw new NotFoundException('Slot not found for the given doctor, date, and time');
    if (slot.status !== 'AVAILABLE') throw new BadRequestException('This slot is already booked');

    // 4. Duplicate booking check
    const existing = await this.appointmentRepo.findOne({
      where: { patientId, slotId: slot.id, status: AppointmentStatus.BOOKED },
    });
    if (existing) throw new BadRequestException('You have already booked this slot');

    // 5. Create appointment
    const appointment = this.appointmentRepo.create({
      patientId,
      doctorId,
      slotId: slot.id,
      date,
      startTime,
      endTime: endTime || slot.endTime,
      status: AppointmentStatus.BOOKED,
    });
    await this.appointmentRepo.save(appointment);

    // 6. Mark slot as BOOKED
    await this.slotRepo.update(slot.id, { status: 'BOOKED' as any });

    return {
      message: 'Appointment booked successfully',
      appointment: {
        id: appointment.id,
        doctorId,
        doctorName: doctor.name,
        date,
        startTime,
        endTime: appointment.endTime,
        status: appointment.status,
      },
    };
  }

  async getMyAppointments(patientId: string) {
    const appointments = await this.appointmentRepo.find({
      where: { patientId },
      order: { date: 'DESC', startTime: 'DESC' },
    });

    if (!appointments.length) return { message: 'No appointments found', appointments: [] };

    const enriched = await Promise.all(
      appointments.map(async (apt) => {
        const doctor = await this.userRepo.findOne({ where: { id: apt.doctorId } });
        return {
          id: apt.id,
          date: apt.date,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: apt.status,
          doctor: { id: apt.doctorId, name: doctor?.name || 'Unknown', email: doctor?.email || '' },
        };
      }),
    );

    return { total: enriched.length, appointments: enriched };
  }

  async cancelAppointment(patientId: string, appointmentId: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.patientId !== patientId) throw new ForbiddenException('You can only cancel your own appointments');
    if (appointment.status === AppointmentStatus.CANCELLED) throw new BadRequestException('Appointment is already cancelled');

    const aptDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
    if (aptDateTime <= new Date()) throw new BadRequestException('Cannot cancel a past appointment');

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepo.save(appointment);

    // Free the slot back to AVAILABLE
    await this.slotRepo.update(appointment.slotId, { status: 'AVAILABLE' as any });

    return { message: 'Appointment cancelled successfully', appointmentId };
  }

  async getDoctorAppointments(doctorId: string) {
    const appointments = await this.appointmentRepo.find({
      where: { doctorId },
      order: { date: 'ASC', startTime: 'ASC' },
    });

    if (!appointments.length) return { message: 'No appointments found', appointments: [] };

    const enriched = await Promise.all(
      appointments.map(async (apt) => {
        const patient = await this.userRepo.findOne({ where: { id: apt.patientId } });
        return {
          id: apt.id,
          date: apt.date,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: apt.status,
          patient: { id: apt.patientId, name: patient?.name || 'Unknown', email: patient?.email || '' },
        };
      }),
    );

    return { total: enriched.length, appointments: enriched };
  }
}
