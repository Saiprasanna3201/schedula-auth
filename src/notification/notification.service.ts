import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { PatientProfile } from '../patient/patient-profile.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    @InjectRepository(PatientProfile)
    private readonly patientRepo: Repository<PatientProfile>,
  ) {}

  async createNotification(
    patientId: string,
    title: string,
    message: string,
    type: NotificationType,
  ) {
    const notification = this.notificationRepo.create({
      patientId,
      title,
      message,
      type,
      isRead: false,
    });
    return this.notificationRepo.save(notification);
  }

  async getNotifications(userId: string) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found.');
    }

    const notifications = await this.notificationRepo.find({
      where: { patientId: patient.id },
      order: { createdAt: 'DESC' },
    });

    if (notifications.length === 0) {
      return { message: 'No notifications found', data: [] };
    }

    return {
      message: 'Notifications retrieved successfully',
      data: notifications,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found.');
    }

    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.patientId !== patient.id) {
      throw new ForbiddenException('Access denied.');
    }

    if (notification.isRead) {
      return {
        message: 'Notification already marked as read',
        data: notification,
      };
    }

    notification.isRead = true;
    const saved = await this.notificationRepo.save(notification);

    return {
      message: 'Notification marked as read',
      data: saved,
    };
  }

  async markAllAsRead(userId: string) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found.');
    }

    await this.notificationRepo.update(
      { patientId: patient.id, isRead: false },
      { isRead: true },
    );

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found.');
    }

    const count = await this.notificationRepo.count({
      where: { patientId: patient.id, isRead: false },
    });

    return { unreadCount: count };
  }
}