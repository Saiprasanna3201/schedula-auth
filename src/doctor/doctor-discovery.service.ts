import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';

export interface DoctorListQuery {
  specialization?: string;
  search?: string;
  page?: number;
  limit?: number;
  availability?: string;
}

@Injectable()
export class DoctorDiscoveryService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorProfileRepo: Repository<DoctorProfile>,
  ) {}

  async findAll(query: DoctorListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.specialization) {
      where.specialization = ILike(`%${query.specialization}%`);
    }

    if (query.search) {
      where.fullName = ILike(`%${query.search}%`);
    }

    const [doctors, total] = await this.doctorProfileRepo.findAndCount({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        fullName: true,
        specialization: true,
        experience: true,
        consultationFee: true,
        availabilityHours: true,
      },
    });

    if (doctors.length === 0) {
      return {
        message: 'No doctors found matching your criteria',
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      };
    }

    return {
      message: 'Doctors fetched successfully',
      data: doctors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new NotFoundException('Invalid doctor ID format');
    }

    const doctor = await this.doctorProfileRepo.findOne({ where: { id } });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return {
      message: 'Doctor profile fetched successfully',
      data: doctor,
    };
  }
}
