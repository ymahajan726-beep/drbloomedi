import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Prescription } from '../entities/prescription.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { Billing } from '../entities/billing.entity';
import { Doctor } from '../entities/doctor.entity';

@Controller('patient-portal')
export class PatientPortalController {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Prescription)
    private readonly rxRepo: Repository<Prescription>,
    @InjectRepository(LabOrder)
    private readonly labRepo: Repository<LabOrder>,
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  // 1. Phone number login
  @Post('login')
  async patientLogin(@Body('phone') phone: string) {
    if (!phone?.trim()) {
      throw new BadRequestException('Phone number is required');
    }
    const patient = await this.patientRepo.findOne({
      where: { phone: phone.trim() },
    });
    if (!patient) {
      throw new NotFoundException('No registered patient found with this mobile number');
    }
    return {
      message: 'Login successful',
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
      },
    };
  }

  // 2. Patient appointments
  @Get('appointments/:patientId')
  async getMyAppointments(@Param('patientId') patientId: string) {
    return this.appointmentRepo.find({
      where: { patient: { id: patientId } },
      relations: { doctor: { user: true } },
      order: { appointmentDate: 'DESC' },
    });
  }

  // 3. Book OPD Appointment
  @Post('book-appointment')
  async bookAppointment(
    @Body()
    body: {
      patientId: string;
      doctorId: number;
      appointmentDate: string;
      reason?: string;
    },
  ) {
    const patient = await this.patientRepo.findOne({ where: { id: body.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const doctor = await this.doctorRepo.findOne({ where: { id: body.doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const appointmentData: any = {
      patient,
      doctor,
      appointmentDate: body.appointmentDate,
      status: AppointmentStatus.SCHEDULED,
    };

    if (body.reason) {
      appointmentData.reason = body.reason;
    }

    const appointment = this.appointmentRepo.create(appointmentData as any);
    return this.appointmentRepo.save(appointment);
  }

  // 4. Digital Prescriptions
  @Get('prescriptions/:patientId')
  async getMyPrescriptions(@Param('patientId') patientId: string) {
    return this.rxRepo.find({
      where: { patient: { id: patientId } },
      relations: { doctor: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }

  // 5. Diagnostic Lab Reports
  @Get('lab-reports/:patientId')
  async getMyLabReports(@Param('patientId') patientId: string) {
    return this.labRepo.find({
      where: { patient: { id: patientId } },
      relations: { labTest: true },
      order: { createdAt: 'DESC' },
    });
  }

  // 6. Billing Invoices
  @Get('bills/:patientId')
  async getMyBills(@Param('patientId') patientId: string) {
    return this.billingRepo.find({
      where: { patient: { id: patientId } },
      order: { createdAt: 'DESC' },
    });
  }
}