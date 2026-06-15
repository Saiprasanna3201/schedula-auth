import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Slot } from '../slots/slot.entity';
import { User } from '../user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Slot, User])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
