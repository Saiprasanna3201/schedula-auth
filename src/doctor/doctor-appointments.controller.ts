import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { DoctorAppointmentService } from './doctor-appointment.service';

@ApiTags('Doctor Appointments')
@ApiBearerAuth()
@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorAppointmentsController {
  constructor(private readonly doctorAppointmentService: DoctorAppointmentService) {}

  // GET /doctor/appointments?date=2026-06-25
  @Get('appointments')
  @ApiOperation({ summary: 'Doctor views all their appointments (optional date filter)' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date YYYY-MM-DD' })
  getAppointments(
    @Request() req,
    @Query('date') date?: string,
  ) {
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }
    return this.doctorAppointmentService.getDoctorAppointments(req.user.id, date);
  }

  // PATCH /doctor/appointments/:id/cancel
  @Patch('appointments/:id/cancel')
  @ApiOperation({ summary: 'Doctor cancels an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  cancelAppointment(
    @Request() req,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => new BadRequestException('Invalid appointment ID format'),
      }),
    )
    id: string,
  ) {
    return this.doctorAppointmentService.cancelAppointment(req.user.id, id);
  }
}
