import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PharmacyController } from '../controllers/pharmacy.controller';
import { PharmacyService } from '../services/pharmacy.service';
import { Medicine } from '../entities/medicine.entity';
import { Patient } from '../entities/patient.entity';
import { Billing } from '../entities/billing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medicine, Patient, Billing]),
  ],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}