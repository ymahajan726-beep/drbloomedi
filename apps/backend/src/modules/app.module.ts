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
import {RolesModule} from './roles.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      username: 'drbloomedi_user',
      password: 'drbloomedi_password_2026',
      database: 'drbloomedi',
      entities: [User, Doctor, Department, Patient, Receptionist, Appointment, Billing

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}