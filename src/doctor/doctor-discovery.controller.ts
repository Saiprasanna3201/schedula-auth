import { Controller, Get, Param, Query } from '@nestjs/common';
import { DoctorDiscoveryService, DoctorListQuery } from './doctor-discovery.service';

@Controller('doctor')
export class DoctorDiscoveryController {
  constructor(private doctorDiscoveryService: DoctorDiscoveryService) {}

  // GET /doctor
  // GET /doctor?specialization=cardiology
  // GET /doctor?search=arjun
  // GET /doctor?page=1&limit=10
  @Get()
  findAll(@Query() query: DoctorListQuery) {
    return this.doctorDiscoveryService.findAll(query);
  }

  // GET /doctor/:id
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.doctorDiscoveryService.findById(id);
  }
}
