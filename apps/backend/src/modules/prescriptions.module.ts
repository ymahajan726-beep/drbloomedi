import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionsController } from '../controllers/prescriptions.controller';
import { PrescriptionsService } from '../services/prescriptions.service';
import { Prescription } from '../entities/prescription.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Appointment } from '../entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prescription,
      Patient,
      Doctor,
      Appointment,
    ]),
  ],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}