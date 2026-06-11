import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { User } from './user.entity';
import { DoctorProfile } from './doctor/doctor-profile.entity';
import { PatientProfile } from './patient/patient-profile.entity';
<<<<<<< HEAD
import { InitSchema1749000000000 } from './database/migrations/1749000000000-InitSchema';
=======
import { RecurringAvailability } from './doctor/availability/recurring-availability.entity';
import { CustomAvailability } from './doctor/availability/custom-availability.entity';
import { InitSchema1749000000000 } from './database/migrations/1749000000000-InitSchema';
import { AddAvailabilityTables1749100000000 } from './database/migrations/1749100000000-AddAvailabilityTables';
>>>>>>> main

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
<<<<<<< HEAD
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'schedula',
      entities: [User, DoctorProfile, PatientProfile],
      migrations: [InitSchema1749000000000],
      synchronize: true,
      migrationsRun: true,
=======
      url: process.env.DATABASE_URL,
      entities: [User, DoctorProfile, PatientProfile, RecurringAvailability, CustomAvailability],
      migrations: [InitSchema1749000000000, AddAvailabilityTables1749100000000],
      synchronize: false,
      migrationsRun: true,
      ssl: {
        rejectUnauthorized: false,
      },
>>>>>>> main
    }),
    AuthModule,
    DoctorModule,
    PatientModule,
  ],
})
export class AppModule {}
