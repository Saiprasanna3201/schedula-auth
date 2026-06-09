import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
<<<<<<< Updated upstream

@Module({
  controllers: [DoctorController],
=======
import { DoctorProfileService } from './doctor-profile.service';
import { DoctorProfile } from './doctor-profile.entity';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { DoctorDiscoveryService } from './doctor-discovery.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfile])],
  controllers: [DoctorController, DoctorDiscoveryController],
  providers: [DoctorProfileService, DoctorDiscoveryService],
>>>>>>> Stashed changes
})
export class DoctorModule {}
