import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';
import { Appointment } from '../entities/appointment.entity';
import { Prescription } from '../entities/prescription.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { Billing } from '../entities/billing.entity';
import { EmrService } from '../services/emr.service';
import { EmrController } from '../controllers/emr.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      Appointment,
      Prescription,
      LabOrder,
      Billing,
    ]),
  ],
  providers: [EmrService],
  controllers: [EmrController],
  exports: [EmrService],
})
export class EmrModule {}