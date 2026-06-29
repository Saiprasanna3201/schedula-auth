import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderService } from './reminder.service';
import { Appointment } from '../appointment/entities/appointment.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Appointment]),
    NotificationModule,
  ],
  providers: [ReminderService],
})
export class ReminderModule {}