import { IsEnum, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../recurring-availability.entity';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateRecurringAvailabilityDto {
  @ApiProperty({ enum: DayOfWeek, example: 'MONDAY' })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM (24h)' })
  startTime: string;

  @ApiProperty({ example: '13:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM (24h)' })
  endTime: string;
}

export class UpdateRecurringAvailabilityDto {
  @ApiProperty({ enum: DayOfWeek, required: false })
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiProperty({ example: '10:00', required: false })
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM (24h)' })
  startTime?: string;

  @ApiProperty({ example: '13:00', required: false })
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM (24h)' })
  endTime?: string;
}
