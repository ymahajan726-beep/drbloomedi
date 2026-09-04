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

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'int', default: 25 })
  age: number;

  @Column({ default: 'Male' })
  gender: string;

  @Column({ default: 'B+' })
  bloodGroup: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ default: 'Outpatient' })
  patientType: string; // Outpatient | Inpatient | Emergency

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}