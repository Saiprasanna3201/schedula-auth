import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsString, Matches } from 'class-validator';

export class BookAppointmentDto {
  @ApiProperty({ example: '1c15c930-b9ab-42b9-99ec-2c81d3ce9d4f' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ example: '2026-06-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;
}
