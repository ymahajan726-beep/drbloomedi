import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Department } from '../entities/department.entity';
import { AppointmentsController } from '../controllers/appointments.controller';
import { AppointmentsService } from '../services/appointments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Patient, Doctor, Department]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}