import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from '../controllers/reports.controller';
import { ReportsService } from '../services/reports.service';
import { Billing } from '../entities/billing.entity';
import { Appointment } from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Department } from '../entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Billing,
      Appointment,
      Patient,
      Doctor,
      Department,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}