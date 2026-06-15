import { IsInt, IsString, Matches, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class GenerateSlotsDto {
  @ApiProperty({ example: '2026-06-20' })
  @IsString()
  @Matches(DATE_REGEX, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ example: 30, description: 'Slot duration in minutes (10, 15, 30, 60)' })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(120)
  durationMinutes: number;
}
