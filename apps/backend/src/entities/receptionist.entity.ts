import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('receptionists')
export class Receptionist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ default: 'Morning (08:00 AM - 04:00 PM)' })
  shiftTiming: string;

  @Column({ default: 'Desk 1 - Main OPD' })
  counterDesk: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}