import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';
import { CreateDoctorProfileDto, UpdateDoctorProfileDto } from './dto/doctor-profile.dto';

@Injectable()
export class DoctorProfileService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorProfileRepo: Repository<DoctorProfile>,
  ) {}

  async create(userId: string, dto: CreateDoctorProfileDto): Promise<DoctorProfile> {
    const existing = await this.doctorProfileRepo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Doctor profile already exists. Use PATCH to update.');
    }

    const profile = this.doctorProfileRepo.create({ ...dto, userId });
    return this.doctorProfileRepo.save(profile);
  }

  async findByUserId(userId: string): Promise<DoctorProfile> {
    const profile = await this.doctorProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found. Please create one first.');
    }
    return profile;
  }

  async update(userId: string, dto: UpdateDoctorProfileDto): Promise<DoctorProfile> {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    return this.doctorProfileRepo.save(profile);
  }
}
