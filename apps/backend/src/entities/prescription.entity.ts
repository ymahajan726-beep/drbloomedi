import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Patient } from './patient.entity';
import { Doctor } from './doctor.entity';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appointmentId: string;

  @Column()
  patientId: string;

  @Column({ nullable: true })
  doctorId: string;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'jsonb', nullable: true })
  vitals: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
  };

  @Column({ type: 'jsonb' })
  medicines: {
    name: string;
    dosage: string;
    freq: string;
    duration: string;
    notes?: string;
  }[];

  @Column({ type: 'text', nullable: true })
  labTests: string;

  @Column({ type: 'text', nullable: true })
  advice: string;

  @Column({ type: 'varchar', nullable: true })
  followUpDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;
}