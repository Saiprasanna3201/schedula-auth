import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateDoctorLeaveDto {
  @ApiProperty({ example: '2026-07-05', description: 'Leave date (YYYY-MM-DD)' })
  @IsDateString()
  leaveDate: string;

  @ApiPropertyOptional({ example: 'Medical conference', description: 'Reason for leave (optional)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
