import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDoctorProfileDto {
  @IsString()
  fullName: string;

  @IsString()
  specialization: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  experience: number;

  @IsString()
  qualification: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  consultationFee: number;

  @IsOptional()
  @IsString()
  availabilityHours?: string;

  @IsOptional()
  @IsString()
  profileDetails?: string;
}

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  experience?: number;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  consultationFee?: number;

  @IsOptional()
  @IsString()
  availabilityHours?: string;

  @IsOptional()
  @IsString()
  profileDetails?: string;
}
