import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../common/types';

// ─── Signup ──────────────────────────────────────────────────────────────────

export class SignupDto {
  @ApiProperty({ example: 'Dr. Arjun Mehta' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'arjun@schedula.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPass123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.DOCTOR })
  @IsEnum(Role)
  role: Role;
}

// ─── Login ───────────────────────────────────────────────────────────────────

export class LoginDto {
  @ApiProperty({ example: 'arjun@schedula.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPass123' })
  @IsString()
  password: string;
}
