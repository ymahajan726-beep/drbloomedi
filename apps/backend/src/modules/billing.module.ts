import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Billing } from '../entities/billing.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { BillingController } from '../controllers/billing.controller';
import { BillingService } from '../services/billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Billing, Patient, Doctor])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}