import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';

@Module({
  imports: [AuthModule, DoctorModule, PatientModule],
})
export class AppModule {}
