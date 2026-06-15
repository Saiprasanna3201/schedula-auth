import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientController } from './patient.controller';
import { PatientProfileService } from './patient-profile.service';
import { PatientProfile } from './patient-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientProfile])],
  controllers: [PatientController],
  providers: [PatientProfileService],
})
export class PatientModule {}