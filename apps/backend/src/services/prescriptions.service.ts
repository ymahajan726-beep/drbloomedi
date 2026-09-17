import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';
import { Prescription } from '../entities/prescription.entity';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async create(data: {
    patientId: string;
    doctorId?: any;
    appointmentId?: string | number;
    diagnosis: string;
    symptoms?: string;
    advice?: string;
    medicines?: any[];
  }) {
    if (!data.patientId) {
      throw new BadRequestException('Patient ID is required');
    }

    const patient = await this.patientRepo.findOne({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient record not found for ID: ${data.patientId}`,
      );
    }

    let doctor: Doctor | null = null;

    if (data.doctorId) {
      try {
        doctor = await this.doctorRepo.findOne({
          where: [
            { id: data.doctorId as any },
            { id: Number(data.doctorId) as any },
          ] as any,
          relations: { user: true },
        });
      } catch {
        doctor = null;
      }
    }

    if (!doctor) {
      const doctors = await this.doctorRepo.find({
        take: 1,
        relations: { user: true },
      });

      doctor = doctors.length ? doctors[0] : null;
    }

    let appointment: Appointment | null = null;

    if (data.appointmentId) {
      appointment = await this.appointmentRepo.findOne({
        where: [
          { id: data.appointmentId as any },
          { id: String(data.appointmentId) as any },
        ] as any,
      });
    }

    if (!appointment) {
      appointment = await this.appointmentRepo.findOne({
        where: { patient: { id: data.patientId } },
        order: { appointmentDate: 'DESC' },
      });
    }

    if (!appointment && doctor) {
      appointment = await this.appointmentRepo.save(
        this.appointmentRepo.create({
          appointmentNumber: `OPD-${Date.now()
            .toString()
            .slice(-6)}`,
          patient,
          doctor,
          appointmentDate: new Date()
            .toISOString()
            .split('T')[0],
          timeSlot: '10:00 AM',
          status: AppointmentStatus.COMPLETED,
        }),
      );
    }

    if (appointment) {
      const existingPrescription =
        await this.prescriptionRepo.findOne({
          where: { appointmentId: appointment.id },
        });

      if (existingPrescription && doctor) {
        appointment = await this.appointmentRepo.save(
          this.appointmentRepo.create({
            appointmentNumber: `OPD-${Date.now()
              .toString()
              .slice(-6)}`,
            patient,
            doctor,
            appointmentDate: new Date()
              .toISOString()
              .split('T')[0],
            timeSlot: appointment.timeSlot || '10:00 AM',
            status: AppointmentStatus.SCHEDULED,
          }),
        );
      }
    }

    if (appointment) {
      try {
        appointment.status = AppointmentStatus.COMPLETED;
        await this.appointmentRepo.save(appointment);
      } catch (e) {
        console.warn(
          'Could not mark appointment COMPLETED',
          e,
        );
      }
    }

    const medicines = Array.isArray(data.medicines)
      ? data.medicines
      : [];

    const prescriptionData: any = {
      patient,
      patientId: patient.id,
      doctor,
      doctorId: doctor?.id,
      appointment,
      appointmentId: appointment?.id,
      diagnosis: data.diagnosis || 'General Clinical Review',
      symptoms: data.symptoms || '',
      advice: data.advice || '',
      medicines,
    };

    try {
      const prescription = this.prescriptionRepo.create(
        prescriptionData as Prescription,
      );

      return await this.prescriptionRepo.save(prescription);
    } catch (dbError: any) {
      console.error(
        'CRITICAL: Prescription Save Error in Postgres:',
        dbError,
      );

      throw new InternalServerErrorException(
        dbError?.message ||
          'Database error while saving prescription',
      );
    }
  }

  async findByPatient(patientId: string) {
    return this.prescriptionRepo.find({
      where: { patient: { id: patientId } } as any,
      relations: { doctor: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }
}
