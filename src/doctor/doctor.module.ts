import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorProfileService } from './doctor-profile.service';
import { DoctorProfile } from './doctor-profile.entity';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { DoctorAppointmentsController } from './doctor-appointments.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorProfile]),
    AppointmentsModule,
    AvailabilityModule,
  ],
  controllers: [DoctorController, DoctorDiscoveryController, DoctorAppointmentsController],
  providers: [DoctorProfileService, DoctorDiscoveryService],
})
export class DoctorModule {}
