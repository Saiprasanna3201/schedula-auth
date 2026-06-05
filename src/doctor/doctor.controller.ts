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

@ApiTags('Doctor')
@ApiBearerAuth()
@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorController {
  @Get('profile')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get doctor profile (DOCTOR only)' })
  @ApiResponse({ status: 200, description: 'Returns doctor profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing/invalid JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden — PATIENT cannot access' })
  getProfile(@Request() req) {
    return {
      message: '✅ Welcome, Doctor!',
      profile: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        specialization: 'General Physician', // placeholder
        hospital: 'Schedula Medical Center',
      },
    };
  }

  @Get('dashboard')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Doctor dashboard — appointments & stats (DOCTOR only)' })
  getDashboard(@Request() req) {
    return {
      message: '📊 Doctor Dashboard',
      doctor: req.user.name,
      stats: {
        totalAppointments: 24,
        pendingApprovals: 5,
        completedToday: 8,
      },
    };
  }
}
