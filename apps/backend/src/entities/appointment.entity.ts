import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { Doctor } from './doctor.entity';
import { Department } from './department.entity';

export enum AppointmentStatus {
  SCHEDULED = 'Scheduled',
  CONFIRMED = 'Confirmed',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  appointmentNumber: string;

  @Column({ type: 'date' })
  appointmentDate: string;

  @Column()
  timeSlot: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
reason: string;
}