import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Prescription } from '../entities/prescription.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { Billing } from '../entities/billing.entity';
import { Doctor } from '../entities/doctor.entity';
import { EventsGateway } from '../gateways/events.gateway';

@Controller('patient-portal')
export class PatientPortalController {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(LabOrder)
    private readonly labOrderRepo: Repository<LabOrder>,
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // 1. Phone Verification Gate
  @Post('auth/verify')
  async verifyPhone(@Body('phone') phone: string) {
    if (!phone || !phone.trim()) {
      throw new BadRequestException('Phone number is required');
    }

    const cleanPhone = phone.trim();
    const patient = await this.patientRepo.findOne({
      where: { phone: cleanPhone },
    });

    if (patient) {
      return {
        exists: true,
        message: 'Existing patient verified',
        patient,
      };
    }

    return {
      exists: false,
      message: 'New patient, registration required',
      phone: cleanPhone,
    };
  }

  // 2. New Patient Quick Registration + Instant Appointment Booking
  @Post('auth/register-and-book')
  async registerAndBook(
    @Body()
    body: {
      fullName: string;
      phone: string;
      email?: string;
      age?: number;
      gender?: string;
      bloodGroup?: string;
      address?: string;
      doctorId: any;
      appointmentDate: string;
      timeSlot?: string;
    },
  ) {
    if (!body.fullName || !body.phone || !body.doctorId || !body.appointmentDate) {
      throw new BadRequestException('Missing required registration or appointment details');
    }

    const cleanPhone = body.phone.trim();

    // A. Check if patient already exists or create new
    let patient = await this.patientRepo.findOne({ where: { phone: cleanPhone } });

    if (!patient) {
      const email = body.email && body.email.trim() !== ''
        ? body.email.trim()
        : `${cleanPhone}@patient.drbloomedi.com`;

      const newPatient = this.patientRepo.create({
        fullName: body.fullName.trim(),
        email: email,
        phone: cleanPhone,
        age: Number(body.age) || 25,
        gender: body.gender || 'Male',
        bloodGroup: body.bloodGroup || 'O+',
        address: body.address || '',
      });

      patient = await this.patientRepo.save(newPatient);
    }

    // B. Find Doctor
    const doctor = await this.doctorRepo.findOne({
      where: { id: body.doctorId as any },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // C. Generate Appointment Number & Book Appointment
    const appointmentDateStr = String(body.appointmentDate).split('T')[0];
    const appointmentNumber = `APT-${Date.now().toString().slice(-6)}`;

    const newAppointment = this.appointmentRepo.create({
      appointmentNumber,
      patient,
      doctor,
      appointmentDate: appointmentDateStr,
      timeSlot: body.timeSlot || '10:00 AM',
      status: AppointmentStatus?.SCHEDULED || ('Scheduled' as any),
    });

    const savedAppointment = await this.appointmentRepo.save(newAppointment);

    // D. Real-Time Broadcast to Reception & Doctor Queue via Socket.IO
    try {
      this.eventsGateway.emitNewAppointment({
        ...savedAppointment,
        patient,
        doctor,
      });
    } catch (socketErr) {
      console.warn('Socket broadcast skipped:', socketErr);
    }

    return {
      success: true,
      message: 'Patient registered and appointment confirmed for Reception',
      patient,
      appointment: savedAppointment,
    };
  }

  // 3. Comprehensive 360° Dossier
  @Get('history/:patientId')
  async getFullPatientHistory(@Param('patientId') patientId: string) {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    const [appointments, prescriptions, labOrders, bills] = await Promise.all([
      this.appointmentRepo.find({
        where: { patient: { id: patientId } },
        relations: { doctor: true },
        order: { appointmentDate: 'DESC' },
      }).catch(() => []),

      this.prescriptionRepo.find({
        where: { patient: { id: patientId } },
        relations: { doctor: true },
        order: { createdAt: 'DESC' },
      }).catch(() => []),

      this.labOrderRepo.find({
        where: { patient: { id: patientId } },
        relations: { labTest: true },
        order: { createdAt: 'DESC' },
      }).catch(() => []),

      this.billingRepo.find({
        where: { patient: { id: patientId } },
        order: { createdAt: 'DESC' },
      }).catch(() => []),
    ]);

    return {
      profile: patient,
      summary: {
        totalVisits: appointments.length,
        totalPrescriptions: prescriptions.length,
        totalLabTests: labOrders.length,
        totalBills: bills.length,
      },
      appointments,
      prescriptions,
      labOrders,
      bills,
    };
  }
}