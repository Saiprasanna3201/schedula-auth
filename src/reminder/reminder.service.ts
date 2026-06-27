import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../appointment/entities/appointment.entity';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendAppointmentReminders() {
    this.logger.log('Running appointment reminder cron job...');

    const now = new Date();

    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    // Get appointments for today that are booked and reminder not sent
    const appointments = await this.appointmentRepo.find({
      where: {
        date: todayStr,
        status: AppointmentStatus.BOOKED,
        reminderSent: false,
      },
      relations: { doctor: true, patient: true },
    });

    this.logger.log(`Found ${appointments.length} appointments to remind`);

    for (const appointment of appointments) {
      try {
        // Check if appointment is within next 2 hours
        const [h, m] = appointment.startTime.split(':').map(Number);
        const appointmentMinutes = h * 60 + m;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const diffMinutes = appointmentMinutes - nowMinutes;

        if (diffMinutes > 0 && diffMinutes <= 120) {
          // Send reminder notification
          await this.notificationService.createNotification(
            appointment.patientId,
            'Appointment Reminder',
            `Reminder: You have an appointment with ${appointment.doctor.fullName} today at ${appointment.startTime}. Token Number: ${appointment.tokenNumber}`,
            NotificationType.APPOINTMENT_REMINDER,
          );

          // Mark reminder as sent
          appointment.reminderSent = true;
          await this.appointmentRepo.save(appointment);

          this.logger.log(`Reminder sent for appointment ${appointment.id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to send reminder for appointment ${appointment.id}`, error);
      }
    }
  }
}