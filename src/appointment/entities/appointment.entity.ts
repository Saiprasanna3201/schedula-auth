import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoctorProfile } from '../../doctor/doctor-profile.entity';
import { PatientProfile } from '../../patient/patient-profile.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: DoctorProfile;

  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => PatientProfile, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'patientId' })
  patient: PatientProfile;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  @Column({ type: 'varchar', default: AppointmentStatus.BOOKED })
  status: AppointmentStatus;

  @Column({ type: 'int', default: 0 })
  tokenNumber: number;

  @Column({ type: 'boolean', default: false })
  reminderSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}