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
import { Bed } from './bed.entity';

export enum AdmissionStatus {
  ADMITTED = 'Admitted',
  DISCHARGED = 'Discharged',
  TRANSFERRED = 'Transferred',
}

@Entity('ipd_admissions')
export class IpdAdmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  admissionNumber: string; // e.g. "IPD-2026-001"

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @ManyToOne(() => Bed, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bedId' })
  bed: Bed;

  @Column({
    type: 'enum',
    enum: AdmissionStatus,
    default: AdmissionStatus.ADMITTED,
  })
  status: AdmissionStatus;

  @Column({ type: 'text', nullable: true })
  admissionDiagnosis: string;

  @Column({ type: 'text', nullable: true })
  dischargeSummary: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  admittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  dischargedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}