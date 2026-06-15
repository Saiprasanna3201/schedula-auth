import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AppointmentsService } from '../appointments/appointments.service';

@ApiTags('Doctor')
@ApiBearerAuth()
@Controller('doctor')
export class DoctorAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'View all appointments booked with me (Doctor only)' })
  myAppointments(@Request() req) {
    return this.appointmentsService.getDoctorAppointments(req.user.id);
  }
}
