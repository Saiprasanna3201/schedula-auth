import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorProfileService } from './doctor-profile.service';
import { DoctorProfile } from './doctor-profile.entity';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { DoctorDiscoveryService } from './doctor-discovery.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfile])],
  controllers: [DoctorController, DoctorDiscoveryController],
  providers: [DoctorProfileService, DoctorDiscoveryService],
})
export class DoctorModule {}