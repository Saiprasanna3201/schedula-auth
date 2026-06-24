import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NextAvailableController } from './next-available.controller';
import { NextAvailableService } from './next-available.service';
import { User } from '../user.entity';
import { DoctorSchedulingConfig } from '../scheduling/scheduling-config.entity';
import { Slot } from '../slots/slot.entity';
import { WaveBooking } from '../scheduling/wave-booking.entity';
import { RecurringAvailability } from '../doctor/availability/recurring-availability.entity';
import { CustomAvailability } from '../doctor/availability/custom-availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      DoctorSchedulingConfig,
      Slot,
      WaveBooking,
      RecurringAvailability,
      CustomAvailability,
    ]),
  ],
  controllers: [NextAvailableController],
  providers: [NextAvailableService],
  exports: [NextAvailableService],
})
export class NextAvailableModule {}