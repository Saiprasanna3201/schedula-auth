import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { PatientProfileService } from './patient-profile.service';
import { CreatePatientProfileDto, UpdatePatientProfileDto } from './dto/patient-profile.dto';

@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PATIENT)
export class PatientController {
  constructor(private patientProfileService: PatientProfileService) {}

  @Post('profile')
  createProfile(@Request() req, @Body() dto: CreatePatientProfileDto) {
    return this.patientProfileService.create(req.user.id, dto);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.patientProfileService.findByUserId(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() dto: UpdatePatientProfileDto) {
    return this.patientProfileService.update(req.user.id, dto);
  }
}