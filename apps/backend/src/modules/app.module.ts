import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { AuthModule } from './auth.module';
import { UsersModule } from './users.module';
import { DashboardModule } from './dashboard.module';
import { DepartmentsModule } from './departments.module';
import { DoctorsModule } from './doctors.module';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { Doctor } from '../entities/doctor.entity';
import { Department } from '../entities/department.entity';
import { PatientsModule } from './patients.module';
import { ReceptionModule } from './reception.module';
import { Receptionist } from '../entities/receptionist.entity';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentsModule } from './appointments.module';
import { BillingModule } from './billing.module';
import { Billing } from '../entities/billing.entity';
import { ReportsModule } from './reports.module';
import { RolesModule } from './roles.module';
import { Prescription } from '../entities/prescription.entity';
import { PrescriptionsModule } from './prescriptions.module';
import { Medicine } from '../entities/medicine.entity';
import { PharmacyModule } from './pharmacy.module';
import { LabModule } from './lab.module';
import { LabTest } from '../entities/lab-test.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { EmrModule } from './emr.module';
import { IpdModule } from './ipd.module';
import { IpdAdmission } from '../entities/ipd-admission.entity';
import { Bed } from '../entities/bed.entity';
import { AdminUserController } from '../controllers/admin-user.controller';
import { AiModule } from './ai.module';
import { EventsModule } from './events.module';
import { PaymentModule } from './payment.module';

// Document Entity & Module
import { MedicalDocument } from '../entities/medical-document.entity';
import { DocumentsModule } from './documents.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? {
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            extra: {
              ssl: {
                rejectUnauthorized: false,
              },
            },
          }
        : {
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME || 'drbloomedi_user',
            password: process.env.DB_PASSWORD || 'drbloomedi_password_2026',
            database: process.env.DB_DATABASE || 'drbloomedi',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          }),
      entities: [
        User,
        Doctor,
        Department,
        Patient,
        Receptionist,
        Appointment,
        Billing,
        Prescription,
        Medicine,
        LabTest,
        LabOrder,
        IpdAdmission,
        Bed,
        MedicalDocument,
      ],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UsersModule,
    DashboardModule,
    DepartmentsModule,
    DoctorsModule,
    PatientsModule,
    ReceptionModule,
    AppointmentsModule,
    BillingModule,
    ReportsModule,
    RolesModule,
    PrescriptionsModule,
    PharmacyModule,
    LabModule,
    EmrModule,
    IpdModule,
    AiModule,
    EventsModule,
    PaymentModule,
    DocumentsModule,
  ],
  controllers: [AppController, AdminUserController],
  providers: [AppService],
})
export class AppModule {}