import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmrController } from '../controllers/emr.controller';
import { EmrService } from '../services/emr.service';
import { Patient } from '../entities/patient.entity';
import { Appointment } from '../entities/appointment.entity';
import { Billing } from '../entities/billing.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { LabTest } from '../entities/lab-test.entity';
import { Prescription } from '../entities/prescription.entity';
import { Doctor } from '../entities/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      Doctor,
      Appointment,
      Billing,
      LabOrder,
      LabTest,
      Prescription,
    ]),
  ],
  controllers: [EmrController],
  providers: [EmrService],
  exports: [EmrService],
})
export class EmrModule {}