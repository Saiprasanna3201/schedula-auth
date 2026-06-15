import {
  Controller,
  Post,
  Get,
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
  ApiParam,
} from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { GenerateSlotsDto } from './dto/slot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@ApiTags('Slots')
@ApiBearerAuth()
@Controller()
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // Doctor: Generate slots for a date
  @Post('doctor/slots/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Doctor generates slots from availability for a date' })
  generate(@Request() req, @Body() dto: GenerateSlotsDto) {
    return this.slotsService.generateSlots(req.user.id, dto);
  }

  // Patient: View available slots for a doctor on a date
  @Get('doctor/:doctorId/slots')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Patient views available slots for a doctor on a date' })
  @ApiParam({ name: 'doctorId', description: 'UUID of the doctor' })
  @ApiQuery({ name: 'date', example: '2026-06-20', description: 'YYYY-MM-DD' })
  getSlots(@Param('doctorId') doctorId: string, @Query('date') date: string) {
    return this.slotsService.getAvailableSlots(doctorId, date);
  }
}
