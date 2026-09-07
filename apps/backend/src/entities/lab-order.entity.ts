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
import { LabTest } from './lab-test.entity';

export enum LabOrderStatus {
  ORDERED = 'Ordered',
  SAMPLE_COLLECTED = 'Sample Collected',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity('lab_orders')
export class LabOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @ManyToOne(() => LabTest, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'labTestId' })
  labTest: LabTest;

  @Column({
    type: 'enum',
    enum: LabOrderStatus,
    default: LabOrderStatus.ORDERED,
  })
  status: LabOrderStatus;

  @Column({ nullable: true })
  resultValue: string;

  @Column({ type: 'text', nullable: true })
  technicianRemarks: string;

  @Column({ type: 'boolean', default: false })
  isAbnormal: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  billedAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  // PDF या Image फ़ाइल का पाथ/URL
  @Column({ type: 'text', nullable: true })
  reportFileUrl: string;
}