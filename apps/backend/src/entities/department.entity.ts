import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'Main Building' })
  location: string;

  @Column({ type: 'int', default: 20 })
  totalBeds: number;

  @Column({ default: 'Active' })
  status: string;

  @OneToMany(() => Doctor, (doctor) => doctor.department)
  doctors: Doctor[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}