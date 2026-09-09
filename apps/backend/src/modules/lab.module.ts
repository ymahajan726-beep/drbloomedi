import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LabTest } from '../entities/lab-test.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Appointment } from '../entities/appointment.entity';

import { LabService } from '../services/lab.service';
import { LabController } from '../controllers/lab.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LabTest,
      LabOrder,
      Patient,
      Doctor,
      Appointment,
    ]),
  ],

  providers: [LabService],

  controllers: [LabController],

  exports: [LabService],
})
export class LabModule {}