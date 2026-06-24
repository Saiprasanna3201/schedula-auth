import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NextAvailableQueryDto {
  @ApiProperty({ description: 'Doctor profile UUID', example: '32283539-456f-4481-a985-c2696a8546cc' })
  @IsUUID()
  doctorId: string;

  @ApiPropertyOptional({ description: 'Number of days to search (1-30)', default: 30, minimum: 1, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  searchDays?: number = 30;
}