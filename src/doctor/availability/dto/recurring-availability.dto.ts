import { IsEnum, IsString, Matches, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';
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

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  allowFutureBooking?: boolean = false;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  maxFutureBookingDays?: number;
}

export class UpdateRecurringAvailabilityDto {
  @ApiProperty({ enum: DayOfWeek, required: false })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiProperty({ example: '10:00', required: false })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM (24h)' })
  startTime?: string;

  @ApiProperty({ example: '13:00', required: false })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM (24h)' })
  endTime?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  allowFutureBooking?: boolean;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  maxFutureBookingDays?: number;
}