import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user.entity';

@Entity('wave_bookings')
export class WaveBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @Column({ type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  windowStart: string;

  @Column({ type: 'time' })
  windowEnd: string;

  @Column({ type: 'int' })
  tokenNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}
