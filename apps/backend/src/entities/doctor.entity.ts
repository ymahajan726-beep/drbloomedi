import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn() id: number;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn()
  user: User | null;

  @Column({ length: 150, nullable: true }) specialization: string;
  @Column({ length: 255, nullable: true }) qualifications: string;
  @Column({ length: 30, nullable: true }) phone: string;
  @Column({ default: true }) isActive: boolean;
  @Column({ nullable: true }) fullName: string;

  @ManyToOne(() => Department, dept => dept.doctors, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}