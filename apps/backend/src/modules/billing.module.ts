import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Billing } from '../entities/billing.entity';
import { Patient } from '../entities/patient.entity';
import { Appointment } from '../entities/appointment.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { IpdAdmission } from '../entities/ipd-admission.entity';

// Controller & Service
import { BillingController } from '../controllers/billing.controller';
import { BillingService } from '../services/billing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Billing,
      Patient,
      Appointment,
      LabOrder,
      IpdAdmission,
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService, TypeOrmModule],
})
export class BillingModule {}