import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entities/appointment.entity';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { PatientProfile } from '../patient/patient-profile.entity';
import { DoctorModule } from '../doctor/doctor.module';
import { AvailabilityModule } from '../doctor/availability/availability.module'; // ✅ add this

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, DoctorProfile, PatientProfile]),
    forwardRef(() => DoctorModule),
    AvailabilityModule, // ✅ add this
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}