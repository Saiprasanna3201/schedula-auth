import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorSchedulingConfig } from './scheduling-config.entity';
import { WaveBooking } from './wave-booking.entity';
import { RecurringAvailability } from '../doctor/availability/recurring-availability.entity';
import { CustomAvailability } from '../doctor/availability/custom-availability.entity';
import { Slot } from '../slots/slot.entity';
import { User } from '../user.entity';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorSchedulingConfig,
      WaveBooking,
      RecurringAvailability,
      CustomAvailability,
      Slot,
      User,
    ]),
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
