import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NextAvailableService } from './next-available.service';
import { NextAvailableQueryDto } from './dto/next-available.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Next Available')
@ApiBearerAuth()
@Controller('appointments')
export class NextAvailableController {
  constructor(private readonly nextAvailableService: NextAvailableService) {}

  @UseGuards(JwtAuthGuard)
  @Get('next-available')
  async getNextAvailable(@Query() query: NextAvailableQueryDto) {
    return this.nextAvailableService.findNextAvailable(query);
  }
}