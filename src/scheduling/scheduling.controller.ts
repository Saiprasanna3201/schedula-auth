import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { SetSchedulingConfigDto, GenerateScheduleDto, BookWaveDto } from './dto/scheduling.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@ApiTags('Scheduling')
@ApiBearerAuth()
@Controller()
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('doctor/scheduling/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Doctor sets scheduling type (STREAM or WAVE) and config' })
  setConfig(@Request() req, @Body() dto: SetSchedulingConfigDto) {
    return this.schedulingService.setSchedulingConfig(req.user.id, dto);
  }

  @Post('doctor/scheduling/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Doctor generates schedule (stream slots or wave windows) for a date' })
  generate(@Request() req, @Body() dto: GenerateScheduleDto) {
    return this.schedulingService.generateSchedule(req.user.id, dto);
  }

  @Post('appointment/wave/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Patient books a token in a wave window' })
  bookWave(@Request() req, @Body() dto: BookWaveDto) {
    return this.schedulingService.bookWaveSlot(req.user.id, dto);
  }
}
