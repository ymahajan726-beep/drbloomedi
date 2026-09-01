import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @Column({
    default: true,
  })
  isActive: boolean;

  // =====================================================
  // PASSWORD RESET TOKEN
  // =====================================================

  @Column({
    type: 'varchar',
    nullable: true,
  })
  resetPasswordToken: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  resetPasswordExpires: Date | null;

  // =====================================================
  // TIMESTAMPS
  // =====================================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}