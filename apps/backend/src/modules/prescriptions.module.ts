import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from '../entities/prescription.entity';
import { Appointment } from '../entities/appointment.entity';
import { PrescriptionsService } from '../services/prescriptions.service';
import { PrescriptionsController } from '../controllers/prescriptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription, Appointment])],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}