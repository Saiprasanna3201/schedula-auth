import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorLeave } from './doctor-leave.entity';
import { DoctorLeaveService } from './doctor-leave.service';
import { DoctorProfile } from '../doctor-profile.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorLeave, DoctorProfile, Appointment])],
  controllers: [],
  providers: [DoctorLeaveService],
  exports: [DoctorLeaveService],
})
export class DoctorLeaveModule {}