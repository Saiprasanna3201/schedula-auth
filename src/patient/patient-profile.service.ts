import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientProfile } from './patient-profile.entity';
import { CreatePatientProfileDto, UpdatePatientProfileDto } from './dto/patient-profile.dto';

@Injectable()
export class PatientProfileService {
  constructor(
    @InjectRepository(PatientProfile)
    private patientProfileRepo: Repository<PatientProfile>,
  ) {}

  async create(userId: string, dto: CreatePatientProfileDto): Promise<PatientProfile> {
    const existing = await this.patientProfileRepo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Patient profile already exists. Use PATCH to update.');
    }

    const profile = this.patientProfileRepo.create({ ...dto, userId });
    return this.patientProfileRepo.save(profile);
  }

  async findByUserId(userId: string): Promise<PatientProfile> {
    const profile = await this.patientProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Patient profile not found. Please create one first.');
    }
    return profile;
  }

  async update(userId: string, dto: UpdatePatientProfileDto): Promise<PatientProfile> {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    return this.patientProfileRepo.save(profile);
  }
}
