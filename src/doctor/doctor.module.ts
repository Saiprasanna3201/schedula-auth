import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorProfileService } from './doctor-profile.service';
import { DoctorProfile } from './doctor-profile.entity';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { DoctorAppointmentsController } from './doctor-appointments.controller';
import { DoctorAppointmentService } from './doctor-appointment.service';
import { AvailabilityModule } from './availability/availability.module';
import { DoctorLeaveModule } from './leave/doctor-leave.module';
import { DoctorLeaveController } from './leave/doctor-leave.controller';
import { User } from '../user.entity';
import { Appointment } from '../appointment/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorProfile, User, Appointment]),
    AvailabilityModule,
    DoctorLeaveModule,
  ],
  controllers: [
    DoctorController,
    DoctorAppointmentsController,
    DoctorLeaveController,
    DoctorDiscoveryController,
  ],
  providers: [DoctorProfileService, DoctorDiscoveryService, DoctorAppointmentService],
})
export class DoctorModule {}