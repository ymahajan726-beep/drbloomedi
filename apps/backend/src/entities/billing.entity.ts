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

export enum PaymentStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  PARTIALLY_PAID = 'Partially Paid',
  CANCELLED = 'Cancelled',
}

export enum PaymentMethod {
  CASH = 'Cash',
  UPI = 'UPI',
  CARD = 'Card',
  INSURANCE = 'Insurance',
  NET_BANKING = 'Net Banking',
}

@Entity('billings')
export class Billing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  consultationFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  treatmentCharges: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  medicineCharges: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}