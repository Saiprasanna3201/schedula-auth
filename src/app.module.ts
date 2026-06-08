import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { User } from './user.entity';
import { DoctorProfile } from './doctor/doctor-profile.entity';
import { PatientProfile } from './patient/patient-profile.entity';
import { InitSchema1749000000000 } from './database/migrations/1749000000000-InitSchema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'schedula',
      entities: [User, DoctorProfile, PatientProfile],
      migrations: [InitSchema1749000000000],
      synchronize: true,
      migrationsRun: true,
    }),
    AuthModule,
    DoctorModule,
    PatientModule,
  ],
})
export class AppModule {}
