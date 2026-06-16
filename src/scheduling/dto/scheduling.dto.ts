import { IsEnum, IsInt, IsOptional, IsString, Matches, Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SchedulingType } from '../scheduling-config.entity';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class SetSchedulingConfigDto {
  @ApiProperty({ enum: SchedulingType, example: 'STREAM' })
  @IsEnum(SchedulingType)
  schedulingType: SchedulingType;

  @ApiProperty({ example: 15, required: false, description: 'Required for STREAM' })
  @ValidateIf((o) => o.schedulingType === SchedulingType.STREAM)
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(120)
  slotDurationMinutes?: number;

  @ApiProperty({ example: 5, required: false, description: 'Optional for STREAM, default 0' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  bufferMinutes?: number;

  @ApiProperty({ example: 5, required: false, description: 'Required for WAVE' })
  @ValidateIf((o) => o.schedulingType === SchedulingType.WAVE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxPatientsPerWindow?: number;
}

export class GenerateScheduleDto {
  @ApiProperty({ example: '2026-06-20' })
  @IsString()
  @Matches(DATE_REGEX, { message: 'date must be YYYY-MM-DD' })
  date: string;
}

export class BookWaveDto {
  @ApiProperty({ example: 'uuid-of-doctor' })
  @IsString()
  doctorId: string;

  @ApiProperty({ example: '2026-06-20' })
  @IsString()
  @Matches(DATE_REGEX, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'windowStart must be HH:MM (24h)' })
  windowStart: string;

  @ApiProperty({ example: '11:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'windowEnd must be HH:MM (24h)' })
  windowEnd: string;
}
