import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';
import { DoctorProfileService } from './doctor-profile.service';
import { CreateDoctorProfileDto, UpdateDoctorProfileDto } from './dto/doctor-profile.dto';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorController {
  constructor(private doctorProfileService: DoctorProfileService) {}

  @Post('profile')
  createProfile(@Request() req, @Body() dto: CreateDoctorProfileDto) {
    return this.doctorProfileService.create(req.user.id, dto);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.doctorProfileService.findByUserId(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() dto: UpdateDoctorProfileDto) {
    return this.doctorProfileService.update(req.user.id, dto);
  }
}