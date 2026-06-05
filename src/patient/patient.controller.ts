import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@ApiTags('Patient')
@ApiBearerAuth()
@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  @Get('profile')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Get patient profile (PATIENT only)' })
  @ApiResponse({ status: 200, description: 'Returns patient profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing/invalid JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden — DOCTOR cannot access' })
  getProfile(@Request() req) {
    return {
      message: '✅ Welcome, Patient!',
      profile: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        bloodGroup: 'B+',          // placeholder
        medicalId: 'SCH-PT-0042',  // placeholder
      },
    };
  }

  @Get('appointments')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Get patient appointments (PATIENT only)' })
  getAppointments(@Request() req) {
    return {
      message: '📅 Your Appointments',
      patient: req.user.name,
      appointments: [
        {
          id: 'APT-001',
          doctor: 'Dr. Arjun Mehta',
          date: '2025-06-10',
          time: '10:00 AM',
          status: 'Confirmed',
        },
      ],
    };
  }
}
