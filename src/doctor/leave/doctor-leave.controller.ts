import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/types';
import { DoctorLeaveService } from './doctor-leave.service';
import { CreateDoctorLeaveDto } from './dto/doctor-leave.dto';

@ApiTags('Doctor Leave')
@ApiBearerAuth()
@Controller('doctor/leave')
export class DoctorLeaveController {
  constructor(private readonly leaveService: DoctorLeaveService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Apply for leave on a specific date (Doctor only)' })
  createLeave(@Request() req, @Body() dto: CreateDoctorLeaveDto) {
    return this.leaveService.createLeave(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get all my leaves (Doctor only)' })
  getMyLeaves(@Request() req) {
    return this.leaveService.getMyLeaves(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Delete a leave entry (Doctor only)' })
  deleteLeave(@Request() req, @Param('id') id: string) {
    return this.leaveService.deleteLeave(req.user.id, id);
  }
}
