import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { SlotsModule } from './slots/slots.module';
import { User } from './user.entity';
import { DoctorProfile } from './doctor/doctor-profile.entity';
import { PatientProfile } from './patient/patient-profile.entity';
import { RecurringAvailability } from './doctor/availability/recurring-availability.entity';
import { CustomAvailability } from './doctor/availability/custom-availability.entity';
import { Slot } from './slots/slot.entity';
import { InitSchema1749000000000 } from './database/migrations/1749000000000-InitSchema';
import { AddAvailabilityTables1749100000000 } from './database/migrations/1749100000000-AddAvailabilityTables';
import { AddSlotsTable1749200000000 } from './database/migrations/1749200000000-AddSlotsTable';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, DoctorProfile, PatientProfile, RecurringAvailability, CustomAvailability, Slot],
      migrations: [
        InitSchema1749000000000,
        AddAvailabilityTables1749100000000,
        AddSlotsTable1749200000000,
      ],
      synchronize: false,
      migrationsRun: true,
      ssl: { rejectUnauthorized: false },
    }),
    AuthModule,
    DoctorModule,
    PatientModule,
    SlotsModule,
  ],
})
export class AppModule {}
