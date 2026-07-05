import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { PatientProfile } from '../patient/patient-profile.entity';
import { AvailabilityService } from '../doctor/availability/availability.service';
import { RecurringAvailability } from '../doctor/availability/recurring-availability.entity';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(DoctorProfile)
    private readonly doctorRepo: Repository<DoctorProfile>,

    @InjectRepository(PatientProfile)
    private readonly patientRepo: Repository<PatientProfile>,

    @InjectRepository(RecurringAvailability)
    private readonly availabilityRepo: Repository<RecurringAvailability>,

    @Inject(forwardRef(() => AvailabilityService))
    private readonly availabilityService: AvailabilityService,

    private readonly notificationService: NotificationService,
  ) {}

  private formatDateTime(date: string, time: string): string {
    const [year, month, day] = date.split('-').map(Number);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const formattedTime = `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    return `${day} ${months[month - 1]} at ${formattedTime}`;
  }

  async bookAppointment(userId: string, dto: BookAppointmentDto) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found. Please create your profile first.');
    }

    const doctor = await this.doctorRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${dto.doctorId} not found`);
    }

    await this.validateDateAndFutureBooking(doctor.userId, dto.date, dto.startTime);
    await this.validateBookingWindow(dto.doctorId, dto.date);

    const existingBooking = await this.appointmentRepo.findOne({
      where: {
        doctorId: dto.doctorId,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (existingBooking) {
      throw new ConflictException('This slot is already booked');
    }

    const maxTokenResult = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .select('MAX(appointment.tokenNumber)', 'max')
      .where('appointment.doctorId = :doctorId', { doctorId: dto.doctorId })
      .andWhere('appointment.date = :date', { date: dto.date })
      .getRawOne();

    const currentMax = maxTokenResult.max ? parseInt(maxTokenResult.max, 10) : 0;
    const tokenNumber = currentMax + 1;

    const appointment = this.appointmentRepo.create({
      doctorId: dto.doctorId,
      patientId: patient.id,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: AppointmentStatus.BOOKED,
      tokenNumber,
    });

    const saved = await this.appointmentRepo.save(appointment);

    const fullAppointment = await this.appointmentRepo.findOne({
      where: { id: saved.id },
      relations: { doctor: true, patient: true },
    });

    try {
      const when = this.formatDateTime(saved.date, saved.startTime);
      await this.notificationService.createNotification(
        patient.id,
        'Appointment Booked',
        `Your appointment with ${doctor.fullName} has been booked successfully for ${when}.`,
        NotificationType.APPOINTMENT_BOOKED,
      );
    } catch (err) {
      console.error('Failed to create booking notification:', err);
    }

    return {
      message: 'Appointment booked successfully',
      data: this.toPatientAppointmentResponse(fullAppointment!),
    };
  }

  async getPatientAppointments(userId: string) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found. Please create your profile first.');
    }

    const appointments = await this.appointmentRepo.find({
      where: { patientId: patient.id },
      relations: { doctor: true },
      order: { date: 'DESC', startTime: 'DESC' },
    });

    if (appointments.length === 0) {
      return { message: 'No appointments found', data: [] };
    }

    return {
      message: 'Appointments retrieved successfully',
      data: appointments.map((appt) => this.toPatientAppointmentResponse(appt)),
    };
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found. Please create your profile first.');
    }

    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
    }

    if (appointment.patientId !== patient.id) {
      throw new ForbiddenException('Access denied: You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('This appointment is already cancelled');
    }

    this.validateCutoff(appointment.date, appointment.startTime);

    appointment.status = AppointmentStatus.CANCELLED;
    const saved = await this.appointmentRepo.save(appointment);

    try {
      const when = this.formatDateTime(saved.date, saved.startTime);
      await this.notificationService.createNotification(
        patient.id,
        'Appointment Cancelled',
        `Your appointment scheduled on ${when} has been cancelled.`,
        NotificationType.APPOINTMENT_CANCELLED,
      );
    } catch (err) {
      console.error('Failed to create cancellation notification:', err);
    }

    return {
      message: 'Appointment cancelled successfully',
      data: this.toPatientAppointmentResponse(saved),
    };
  }

  async rescheduleAppointment(userId: string, appointmentId: string, dto: RescheduleAppointmentDto) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
    }

    if (appointment.patientId !== patient.id) {
      throw new ForbiddenException('You can only reschedule your own appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot reschedule a cancelled appointment');
    }

    this.validateCutoff(appointment.date, appointment.startTime);

    if (
      appointment.date === dto.date &&
      appointment.startTime === dto.startTime &&
      appointment.endTime === dto.endTime
    ) {
      throw new BadRequestException('New slot is the same as the current slot');
    }

    const doctor = await this.doctorRepo.findOne({ where: { id: appointment.doctorId } });
    await this.validateDateAndFutureBooking(doctor!.userId, dto.date, dto.startTime);
    await this.validateBookingWindow(appointment.doctorId, dto.date);

    const conflict = await this.appointmentRepo.findOne({
      where: {
        doctorId: appointment.doctorId,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (conflict) {
      const suggestion = await this.findNextAvailableSlot(
        appointment.doctorId,
        dto.date,
        dto.startTime,
        dto.endTime,
      );
      throw new ConflictException({
        message: 'Requested slot unavailable',
        suggestion: suggestion
          ? `Next available slot: ${suggestion.date} ${suggestion.startTime} - ${suggestion.endTime}`
          : 'No alternative slots found on this date',
      });
    }

    appointment.date = dto.date;
    appointment.startTime = dto.startTime;
    appointment.endTime = dto.endTime;

    const saved = await this.appointmentRepo.save(appointment);

    try {
      const when = this.formatDateTime(saved.date, saved.startTime);
      await this.notificationService.createNotification(
        patient.id,
        'Appointment Rescheduled',
        `Your appointment has been rescheduled to ${when}.`,
        NotificationType.APPOINTMENT_RESCHEDULED,
      );
    } catch (err) {
      console.error('Failed to create reschedule notification:', err);
    }

    return {
      message: 'Appointment rescheduled successfully',
      data: this.toPatientAppointmentResponse(saved),
    };
  }

  async getDoctorAppointments(userId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found. Please create your profile first.');
    }

    const appointments = await this.appointmentRepo.find({
      where: { doctorId: doctor.id },
      relations: { patient: true },
      order: { date: 'DESC', startTime: 'DESC' },
    });

    if (appointments.length === 0) {
      return { message: 'No appointments found', data: [] };
    }

    return {
      message: 'Appointments retrieved successfully',
      data: appointments.map((appt) => this.toDoctorAppointmentResponse(appt)),
    };
  }

  async doctorCancelAppointment(doctorUserId: string, appointmentId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found. Please create your profile first.');
    }

    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
    }

    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException('You are not authorized to cancel this appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('This appointment is already cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    const saved = await this.appointmentRepo.save(appointment);

    try {
      const when = this.formatDateTime(saved.date, saved.startTime);
      await this.notificationService.createNotification(
        appointment.patientId,
        'Appointment Cancelled',
        `Your appointment scheduled on ${when} has been cancelled by the doctor.`,
        NotificationType.APPOINTMENT_CANCELLED,
      );
    } catch (err) {
      console.error('Failed to create cancellation notification:', err);
    }

    return {
      message: 'Appointment cancelled successfully',
      data: this.toDoctorAppointmentResponse(saved),
    };
  }

  async getPatientDashboardStats(userId: string) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found. Please create your profile first.');
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    const upcomingAppointments = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .where('appointment.patientId = :patientId', { patientId: patient.id })
      .andWhere('appointment.date >= :today', { today: todayStr })
      .andWhere('appointment.status = :status', { status: AppointmentStatus.BOOKED })
      .getCount();

    const pastAppointments = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .where('appointment.patientId = :patientId', { patientId: patient.id })
      .andWhere('appointment.date < :today', { today: todayStr })
      .getCount();

    return {
      upcomingAppointments,
      pastAppointments,
      prescriptions: 0,
    };
  }

  // ─── Day 18 + 20: Date & future booking validation ───────────────────────────
  private async validateDateAndFutureBooking(
    doctorUserId: string,
    date: string,
    startTime: string,
  ): Promise<void> {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    if (date < todayStr) {
      throw new BadRequestException('Bookings for past dates are not allowed');
    }

    if (date === todayStr) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [h, m] = startTime.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      if (slotMinutes <= currentMinutes) {
        throw new BadRequestException('Cannot book appointment for a past time slot');
      }
      return; // today is always allowed (within time)
    }

    // date > todayStr — future date
    const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = DAY_NAMES[new Date(date).getDay()];

    const availability = await this.availabilityRepo.findOne({
      where: { doctorId: doctorUserId, dayOfWeek: dayOfWeek as any },
    });

    if (!availability) {
      throw new BadRequestException(`Doctor is not available on ${dayOfWeek}`);
    }

    if (!availability.allowFutureBooking) {
      throw new BadRequestException('This doctor only accepts same-day appointments');
    }

    const maxDays = availability.maxFutureBookingDays ?? 7;
    const diffTime = new Date(date).getTime() - new Date(todayStr).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > maxDays) {
      throw new BadRequestException(
        `Booking only allowed up to ${maxDays} days in advance. Requested ${diffDays} days ahead.`,
      );
    }
  }

  // ─── Day 19: Time-based booking window validation ────────────────────────────
  private async validateBookingWindow(doctorProfileId: string, date: string): Promise<void> {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    // Booking window only applies to today
    if (date !== todayStr) return;

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorProfileId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const availability = await this.availabilityService.getAvailabilityForDate(doctor.userId, date);

    if (!availability.slots || availability.slots.length === 0) {
      throw new BadRequestException('Doctor is not available on this date');
    }

    const starts = availability.slots.map((s) => this.toMinutesLocal(s.startTime));
    const ends = availability.slots.map((s) => this.toMinutesLocal(s.endTime));
    const consultationStart = Math.min(...starts);
    const consultationEnd = Math.max(...ends);

    const bookingOpensAt = consultationStart - 120;
    const bookingClosesAt = consultationEnd - 60;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (nowMinutes < bookingOpensAt) {
      throw new BadRequestException(
        `Booking window has not opened yet. Booking opens at ${this.minutesToTime(bookingOpensAt)}.`,
      );
    }

    if (nowMinutes > bookingClosesAt) {
      throw new BadRequestException(
        `Booking window has closed. Booking closed at ${this.minutesToTime(bookingClosesAt)}.`,
      );
    }
  }

  private toMinutesLocal(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private validateCutoff(date: string, startTime: string): void {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    if (date < todayStr) {
      throw new BadRequestException('Cannot modify a past appointment');
    }

    if (date === todayStr) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [h, m] = startTime.split(':').map(Number);
      const slotMinutes = h * 60 + m;

      if (slotMinutes - currentMinutes < 30) {
        throw new BadRequestException('Cannot reschedule or cancel within 30 minutes of appointment time');
      }
    }
  }

  private async findNextAvailableSlot(
    doctorId: string,
    date: string,
    fromStartTime: string,
    slotLengthHint: string,
  ): Promise<{ date: string; startTime: string; endTime: string } | null> {
    const [fh, fm] = fromStartTime.split(':').map(Number);
    const [eh, em] = slotLengthHint.split(':').map(Number);
    const durationMinutes = eh * 60 + em - (fh * 60 + fm);

    if (durationMinutes <= 0) return null;

    const dayEndMinutes = 23 * 60;
    let cursor = fh * 60 + fm + 15;

    while (cursor + durationMinutes <= dayEndMinutes) {
      const candidateStart = this.minutesToTime(cursor);
      const candidateEnd = this.minutesToTime(cursor + durationMinutes);

      const taken = await this.appointmentRepo.findOne({
        where: {
          doctorId,
          date,
          startTime: candidateStart,
          endTime: candidateEnd,
          status: AppointmentStatus.BOOKED,
        },
      });

      if (!taken) {
        return { date, startTime: candidateStart, endTime: candidateEnd };
      }
      cursor += 15;
    }
    return null;
  }

  private minutesToTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private toPatientAppointmentResponse(appointment: Appointment) {
    return {
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      tokenNumber: appointment.tokenNumber,
      doctor: appointment.doctor
        ? {
            id: appointment.doctor.id,
            fullName: appointment.doctor.fullName,
            specialization: appointment.doctor.specialization,
            consultationFee: Number(appointment.doctor.consultationFee),
          }
        : null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  private toDoctorAppointmentResponse(appointment: Appointment) {
    return {
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      tokenNumber: appointment.tokenNumber,
      patient: appointment.patient
        ? {
            id: appointment.patient.id,
            fullName: appointment.patient.fullName,
            age: appointment.patient.age,
            gender: appointment.patient.gender,
          }
        : null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}