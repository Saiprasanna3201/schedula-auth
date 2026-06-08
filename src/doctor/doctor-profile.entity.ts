import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user.entity';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column()
  fullName: string;

  @Column()
  specialization: string;

  @Column({ type: 'int' })
  experience: number;

  @Column()
  qualification: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  consultationFee: number;

  @Column({ type: 'text', nullable: true })
  availabilityHours: string;

  @Column({ type: 'text', nullable: true })
  profileDetails: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
