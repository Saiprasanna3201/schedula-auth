import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorProfileService } from './doctor-profile.service';
import { DoctorProfile } from './doctor-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfile])],
  controllers: [DoctorController],
  providers: [DoctorProfileService],
})
export class DoctorModule {}
