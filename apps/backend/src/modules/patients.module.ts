import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity'; // <--- यह इम्पोर्ट जोड़ें
import { Appointment } from '../entities/appointment.entity';
import { Prescription } from '../entities/prescription.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { Billing } from '../entities/billing.entity';
import { Doctor } from '../entities/doctor.entity';

// Controllers
import { PatientsController } from '../controllers/patients.controller';
import { PatientPortalController } from '../controllers/patient-portal.controller';

// Services
import { PatientsService } from '../services/patients.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      User, // <--- UserRepository के लिए यह जोड़ना आवश्यक है
      Appointment,
      Prescription,
      LabOrder,
      Billing,
      Doctor,
    ]),
  ],
  controllers: [
    PatientsController,
    PatientPortalController,
  ],
  providers: [PatientsService],
  exports: [PatientsService, TypeOrmModule],
})
export class PatientsModule {}