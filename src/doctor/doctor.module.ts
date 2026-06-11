import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorProfileService } from './doctor-profile.service';
import { DoctorProfile } from './doctor-profile.entity';
<<<<<<< HEAD

@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfile])],
  controllers: [DoctorController],
  providers: [DoctorProfileService],
=======
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { AvailabilityModule } from './availability/availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorProfile]),
    AvailabilityModule,
  ],
  controllers: [DoctorController, DoctorDiscoveryController],
  providers: [DoctorProfileService, DoctorDiscoveryService],
>>>>>>> main
})
export class DoctorModule {}