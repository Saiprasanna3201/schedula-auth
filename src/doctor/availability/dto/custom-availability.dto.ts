import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateCustomAvailabilityDto {
  @ApiProperty({ example: '2026-06-15' })
  @IsString()
  @Matches(DATE_REGEX, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM (24h)' })
  startTime: string;

  @ApiProperty({ example: '15:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM (24h)' })
  endTime: string;
}
