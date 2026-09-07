import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Patient } from './patient.entity';

export enum DocumentType {
  LAB_REPORT = 'LAB_REPORT',
  PRESCRIPTION_SCAN = 'PRESCRIPTION_SCAN',
  XRAY_SCAN = 'XRAY_SCAN',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  OTHER = 'OTHER',
}

@Entity('medical_documents')
export class MedicalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column()
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.LAB_REPORT,
  })
  documentType: DocumentType;

  @Column({ nullable: true })
  remarks: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE', nullable: true })
  patient: Patient;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}