import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LabCategory {
  HEMATOLOGY = 'Hematology',
  BIOCHEMISTRY = 'Biochemistry',
  MICROBIOLOGY = 'Microbiology',
  RADIOLOGY = 'Radiology',
  SEROLOGY = 'Serology',
  URINALYSIS = 'Urinalysis',
}

@Entity('lab_tests')
export class LabTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  testName: string;

  @Column({
    type: 'enum',
    enum: LabCategory,
    default: LabCategory.BIOCHEMISTRY,
  })
  category: LabCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ nullable: true })
  sampleType: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  normalRange: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}