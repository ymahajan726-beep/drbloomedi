import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,

  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}