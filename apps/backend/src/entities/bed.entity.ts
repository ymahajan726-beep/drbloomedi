import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WardType {
  GENERAL = 'General Ward',
  ICU = 'ICU',
  PRIVATE = 'Private Room',
  SEMI_PRIVATE = 'Semi-Private',
  EMERGENCY = 'Emergency',
}

export enum BedStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  MAINTENANCE = 'Maintenance',
}

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  bedNumber: string; // e.g. "GW-101", "ICU-04"

  @Column({
    type: 'enum',
    enum: WardType,
    default: WardType.GENERAL,
  })
  wardType: WardType;

  @Column({
    type: 'enum',
    enum: BedStatus,
    default: BedStatus.AVAILABLE,
  })
  status: BedStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 500.0 })
  dailyRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}