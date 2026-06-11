import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/types';
import { AvailabilityService } from './availability.service';
import { CreateRecurringAvailabilityDto, UpdateRecurringAvailabilityDto } from './dto/recurring-availability.dto';
import { CreateCustomAvailabilityDto } from './dto/custom-availability.dto';

@ApiTags('Doctor Availability')
@ApiBearerAuth()
@Controller('doctor/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Set recurring weekly availability' })
  create(@Request() req, @Body() dto: CreateRecurringAvailabilityDto) {
    return this.availabilityService.createRecurring(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get my recurring availability' })
  findAll(@Request() req) {
    return this.availabilityService.getRecurring(req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Update a recurring availability slot' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateRecurringAvailabilityDto) {
    return this.availabilityService.updateRecurring(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Delete a recurring availability slot' })
  remove(@Request() req, @Param('id') id: string) {
    return this.availabilityService.deleteRecurring(req.user.id, id);
  }

  @Post('override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Set custom date override availability' })
  createOverride(@Request() req, @Body() dto: CreateCustomAvailabilityDto) {
    return this.availabilityService.createOverride(req.user.id, dto);
  }

  @Get('date')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get availability for a specific date (override takes priority)' })
  @ApiQuery({ name: 'date', example: '2026-06-15', description: 'YYYY-MM-DD' })
  getByDate(@Request() req, @Query('date') date: string) {
    return this.availabilityService.getAvailabilityForDate(req.user.id, date);
  }
}