import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto } from './dto/appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointment')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Book an appointment (Patient only)' })
  book(@Request() req, @Body() dto: BookAppointmentDto) {
    return this.appointmentsService.bookAppointment(req.user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'View my appointments (Patient only)' })
  myAppointments(@Request() req) {
    return this.appointmentsService.getMyAppointments(req.user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Cancel an appointment (Patient only)' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.cancelAppointment(req.user.id, id);
  }
}
