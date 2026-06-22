import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NextAvailableService } from './next-available.service';
import { NextAvailableQueryDto } from './dto/next-available.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('appointments')
export class NextAvailableController {
  constructor(private readonly nextAvailableService: NextAvailableService) {}

  @UseGuards(JwtAuthGuard)
  @Get('next-available')
  async getNextAvailable(@Query() query: NextAvailableQueryDto) {
    return this.nextAvailableService.findNextAvailable(query);
  }
}