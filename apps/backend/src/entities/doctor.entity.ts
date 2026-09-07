import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Department } from './department.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ length: 150, nullable: true })
  specialization: string;

  @Column({ length: 255, nullable: true })
  qualifications: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Department, (dept) => dept.doctors, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  fullName: string;
}