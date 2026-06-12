import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Slot } from './slot.entity';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { RecurringAvailability } from '../doctor/availability/recurring-availability.entity';
import { CustomAvailability } from '../doctor/availability/custom-availability.entity';
import { User } from '../user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Slot, RecurringAvailability, CustomAvailability, User]),
  ],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
