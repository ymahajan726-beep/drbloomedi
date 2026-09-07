import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from '../entities/prescription.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';

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
    doctorId: number | string;
    appointmentId?: string | number;
    diagnosis: string;
    symptoms?: string;
    advice?: string;
    medicines?: any[];
  }) {
    // 1. Patient check
    const patient = await this.patientRepo.findOne({
      where: { id: data.patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    // 2. Doctor check (fallback to first doctor if ID not matched)
    let doctor: Doctor | null = null;
    try {
      doctor = await this.doctorRepo.findOne({
        where: { id: Number(data.doctorId) || 1 },
        relations: { user: true },
      });
    } catch {
      doctor = null;
    }

    if (!doctor) {
      const doctors = await this.doctorRepo.find({ take: 1, relations: { user: true } });
      doctor = doctors.length > 0 ? doctors[0] : null;
    }

    // 3. Mark appointment COMPLETED if exists
    let appointment: Appointment | null = null;
    const cleanApptId = data.appointmentId ? String(data.appointmentId) : null;

    if (cleanApptId) {
      try {
        appointment = await this.appointmentRepo.findOne({
          where: { id: cleanApptId as any },
        });
        if (appointment) {
          appointment.status = AppointmentStatus.COMPLETED;
          await this.appointmentRepo.save(appointment);
        }
      } catch (err) {
        console.warn('Could not update appointment status:', err);
      }
    }

    // 4. Check for existing prescription by appointmentId (Safely handling relation or column)
    let existingPrescription: Prescription | null = null;
    if (cleanApptId) {
      try {
        existingPrescription = await this.prescriptionRepo
          .createQueryBuilder('p')
          .leftJoinAndSelect('p.appointment', 'appointment')
          .where('p.appointmentId = :apptId OR appointment.id = :apptId', { apptId: cleanApptId })
          .getOne();
      } catch {
        try {
          existingPrescription = await this.prescriptionRepo.findOne({
            where: { appointment: { id: cleanApptId } } as any,
          });
        } catch {
          existingPrescription = null;
        }
      }
    }

    const medsList = Array.isArray(data.medicines) ? data.medicines : [];
    const adviceText = data.advice || '';

    // If existing found, UPDATE it
    if (existingPrescription) {
      existingPrescription.diagnosis = data.diagnosis || 'General Clinical Review';
      existingPrescription.symptoms = data.symptoms || existingPrescription.symptoms || '';
      existingPrescription.advice = adviceText;
      existingPrescription.medicines = medsList;
      if (doctor) existingPrescription.doctor = doctor;
      return await this.prescriptionRepo.save(existingPrescription);
    }

    // Otherwise, INSERT new record
    const newPrescriptionPayload: any = {
      patient,
      diagnosis: data.diagnosis || 'General Clinical Review',
      symptoms: data.symptoms || '',
      advice: adviceText,
      medicines: medsList,
    };

    if (doctor) {
      newPrescriptionPayload.doctor = doctor;
    }

    if (appointment) {
      newPrescriptionPayload.appointment = appointment;
    }

    const created = this.prescriptionRepo.create(newPrescriptionPayload as Prescription);
    return await this.prescriptionRepo.save(created);
  }

  async findByPatient(patientId: string) {
    return this.prescriptionRepo.find({
      where: { patient: { id: patientId } } as any,
      relations: { doctor: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }
}