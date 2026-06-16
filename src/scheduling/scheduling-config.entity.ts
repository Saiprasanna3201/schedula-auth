import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user.entity';

export enum SchedulingType {
  STREAM = 'STREAM',
  WAVE = 'WAVE',
}

@Entity('doctor_scheduling_config')
export class DoctorSchedulingConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @Column({ type: 'uuid', unique: true })
  doctorId: string;

  @Column({ type: 'enum', enum: SchedulingType })
  schedulingType: SchedulingType;

  // STREAM config
  @Column({ type: 'int', nullable: true })
  slotDurationMinutes: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  bufferMinutes: number;

  // WAVE config
  @Column({ type: 'int', nullable: true })
  maxPatientsPerWindow: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
