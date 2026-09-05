import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTION = 'RECEPTION',
  PATIENT = 'PATIENT',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true, default: 'Staff User' })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];
}