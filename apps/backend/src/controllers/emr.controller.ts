// apps/backend/src/controllers/emr.controller.ts
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
import { Prescription } from '../entities/prescription.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { LabOrder, LabOrderStatus } from '../entities/lab-order.entity';
import { LabTest } from '../entities/lab-test.entity';

@Controller('emr')
export class EmrController {
  constructor(
    @InjectRepository(Prescription)
    private readonly rxRepo: Repository<Prescription>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(LabOrder)
    private readonly labOrderRepo: Repository<LabOrder>,
    @InjectRepository(LabTest)
    private readonly labTestRepo: Repository<LabTest>,
  ) {}

  // 1. Patient ki 360 History (QueryBuilder Safe Approach)
  @Get('patient/:id')
  async getPatientMedicalHistory(@Param('id') id: string) {
    const patient = await this.patientRepo.findOne({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient record not found for ID: ${id}`);
    }

    const [prescriptions, labOrders, appointmentCount] = await Promise.all([
      this.rxRepo
        .createQueryBuilder('rx')
        .leftJoinAndSelect('rx.doctor', 'doctor')
        .leftJoinAndSelect('doctor.user', 'user')
        .where('rx.patientId = :patientId', { patientId: id })
        .orderBy('rx.createdAt', 'DESC')
        .getMany(),
      this.labOrderRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.labTest', 'labTest')
        .where('order.patientId = :patientId', { patientId: id })
        .orderBy('order.createdAt', 'DESC')
        .getMany(),
      this.appointmentRepo
        .createQueryBuilder('apt')
        .where('apt.patientId = :patientId', { patientId: id })
        .getCount(),
    ]);

    return {
      isOldPatient: appointmentCount > 1,
      patient: {
        ...patient,
        prescriptions,
        labOrders,
      },
    };
  }

  // 2. Doctor Consultation Save + Lab Test Order + Next Visit
  @Post('consultation')
  async saveConsultation(
    @Body()
    body: {
      patientId: string;
      doctorId?: number;
      appointmentId?: number;
      diagnosis: string;
      clinicalNotes?: string;
      nextVisitDate?: string;
      consultationFee?: number;
      medications?: Array<{
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
      }>;
      labTestsSuggested?: Array<{
        testName: string;
        testPrice: number;
      }>;
    },
  ) {
    if (!body.patientId) {
      throw new BadRequestException('Patient ID is required');
    }

    if (!body.diagnosis) {
      throw new BadRequestException('Clinical diagnosis is required');
    }

    // 1. Validate Patient
    const patient = await this.patientRepo.findOne({ where: { id: body.patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient not found with ID: ${body.patientId}`);
    }

    // 2. Resolve Appointment (Using QueryBuilder to prevent type errors)
    let appointment: any = null;
    if (body.appointmentId) {
      appointment = await this.appointmentRepo
        .createQueryBuilder('apt')
        .leftJoinAndSelect('apt.doctor', 'doctor')
        .where('apt.id = :id', { id: Number(body.appointmentId) })
        .getOne();
    }

    // If appointmentId was not sent or invalid, find the latest active appointment for this patient
    if (!appointment) {
      appointment = await this.appointmentRepo
        .createQueryBuilder('apt')
        .leftJoinAndSelect('apt.doctor', 'doctor')
        .where('apt.patientId = :patientId', { patientId: patient.id })
        .orderBy('apt.id', 'DESC')
        .getOne();
    }

    // 3. Validate Doctor
    let doctor: Doctor | null = null;
    if (body.doctorId) {
      doctor = await this.doctorRepo.findOne({
        where: { id: Number(body.doctorId) },
        relations: { user: true },
      });
    } else if (appointment?.doctor) {
      doctor = appointment.doctor;
    }

    if (!doctor) {
      const allDoctors = await this.doctorRepo.find({ relations: { user: true } });
      if (allDoctors.length > 0) {
        doctor = allDoctors[0];
      } else {
        throw new NotFoundException('No doctor profile exists in the system');
      }
    }

    // If still no appointment exists, create one dynamically to fulfill DB NOT NULL constraint
    if (!appointment) {
      const today = new Date().toISOString().split('T')[0];
      const countToday = await this.appointmentRepo.count();
      const aptPayload: any = {
        appointmentNumber: `APT-${Date.now()}-${countToday + 1}`,
        patient,
        doctor,
        appointmentDate: today,
        timeSlot: '10:00 AM',
        reason: body.diagnosis,
        status: AppointmentStatus.COMPLETED,
      };
      const createdApt = this.appointmentRepo.create(aptPayload as Appointment);
      appointment = await this.appointmentRepo.save(createdApt);
    }

    // 4. Create and Save Prescription matching exact DB columns
    const rxPayload: any = {
      patient,
      doctor,
      appointment,
      appointmentId: appointment.id,
      diagnosis: body.diagnosis,
      advice: body.clinicalNotes || '',
      followUpDate: body.nextVisitDate || null,
      medicines: body.medications || [],
      labTests: body.labTestsSuggested?.map((t) => t.testName) || [],
    };

    const rx = this.rxRepo.create(rxPayload as Prescription);
    const savedRx = await this.rxRepo.save(rx);

    // 5. Create Lab Orders (if suggested by doctor)
    if (body.labTestsSuggested && body.labTestsSuggested.length > 0) {
      for (const t of body.labTestsSuggested) {
        if (!t.testName) continue;

        let test = await this.labTestRepo.findOne({ where: { testName: t.testName } });
        if (!test) {
          const newTestPayload: any = {
            testName: t.testName,
            category: 'General Pathology',
            price: Number(t.testPrice) || 350.0,
            isActive: true,
          };
          const createdTest = this.labTestRepo.create(newTestPayload as LabTest);
          test = await this.labTestRepo.save(createdTest);
        }

        if (test) {
          const labOrderPayload: any = {
            orderNumber: `LAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            patient,
            labTest: test,
            status: LabOrderStatus.ORDERED,
          };
          const labOrder = this.labOrderRepo.create(labOrderPayload as LabOrder);
          await this.labOrderRepo.save(labOrder);
        }
      }
    }

    // 6. Update Appointment to COMPLETED
    if (appointment?.id) {
      await this.appointmentRepo.update(appointment.id, {
        status: AppointmentStatus.COMPLETED,
      });
    }

    return {
      message: 'Consultation saved and synced across departments successfully',
      prescription: savedRx,
    };
  }
}