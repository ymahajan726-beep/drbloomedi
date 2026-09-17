import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

const DEFAULT_SHIFT = 'Morning (08:00 AM - 04:00 PM)';
const DEFAULT_DESK = 'Desk 1 - Main OPD';

@Entity('receptionists')
export class Receptionist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  fullName: string;

  @Column({ unique: true, length: 120 })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ default: DEFAULT_SHIFT })
  shiftTiming: string;

  @Column({ default: DEFAULT_DESK })
  counterDesk: string;

  // soft-disable instead of deleting the row (attendance/logs still point here)
  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}