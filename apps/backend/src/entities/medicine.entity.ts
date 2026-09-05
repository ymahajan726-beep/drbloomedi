import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MedicineCategory {
  TABLET = 'Tablet',
  CAPSULE = 'Capsule',
  SYRUP = 'Syrup',
  INJECTION = 'Injection',
  OINTMENT = 'Ointment',
  DROPS = 'Drops',
  OTHER = 'Other',
}

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  genericName: string;

  @Column({
    type: 'enum',
    enum: MedicineCategory,
    default: MedicineCategory.TABLET,
  })
  category: MedicineCategory;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'int', default: 10 })
  minStockAlert: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  unitPrice: number;

  @Column({ type: 'varchar', nullable: true })
  expiryDate: string; // Format: YYYY-MM-DD

  @Column({ nullable: true })
  manufacturer: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}