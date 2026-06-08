import { IsString, IsNumber, IsOptional, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePatientProfileDto {
  @IsString()
  fullName: string;

  @IsNumber()
  @Min(0)
  @Max(150)
  @Type(() => Number)
  age: number;

  @IsString()
  @IsIn(['Male', 'Female', 'Other'])
  gender: string;

  @IsString()
  contactNumber: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  basicHealthInfo?: string;
}

export class UpdatePatientProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
  @Type(() => Number)
  age?: number;

  @IsOptional()
  @IsString()
  @IsIn(['Male', 'Female', 'Other'])
  gender?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  basicHealthInfo?: string;
}
