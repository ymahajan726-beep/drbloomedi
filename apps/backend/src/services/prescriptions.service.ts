import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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

    // 1. Patient check
    const patient = await this.patientRepo.findOne({
      where: { id: data.patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient record not found for ID: ${data.patientId}`);
    }

    // 2. Doctor check (robust lookup)
    let doctor: Doctor | null = null;
    if (data.doctorId) {
      try {
        doctor = await this.doctorRepo.findOne({
          where: [{ id: data.doctorId as any }, { id: Number(data.doctorId) as any }] as any,
          relations: { user: true },
        });
      } catch {
        doctor = null;
      }
    }

    if (!doctor) {
      const doctors = await this.doctorRepo.find({ take: 1, relations: { user: true } });
      doctor = doctors.length > 0 ? doctors[0] : null;
    }

    // 3. Appointment Resolve (Crucial for Postgres NOT NULL constraint)
    let appointment: Appointment | null = null;

    if (data.appointmentId) {
      appointment = await this.appointmentRepo.findOne({
        where: [{ id: data.appointmentId as any }, { id: String(data.appointmentId) as any }] as any,
      });
    }

    // Fallback: Agar frontend se appointmentId nahi aayi, toh is patient ka latest scheduled appointment uthao
    if (!appointment) {
      appointment = await this.appointmentRepo.findOne({
        where: { patient: { id: data.patientId } },
        order: { appointmentDate: 'DESC' },
      });
    }

    // Agar abhi bhi appointment nahi mila, toh crash roko aur ek instant OPD appointment generate kar do
    if (!appointment && doctor) {
      const fallbackApt = this.appointmentRepo.create({
        appointmentNumber: `OPD-${Date.now().toString().slice(-6)}`,
        patient,
        doctor,
        appointmentDate: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM',
        status: AppointmentStatus.COMPLETED,
      });
      appointment = await this.appointmentRepo.save(fallbackApt);
    }

    // A patient can have multiple prescriptions over time. If the resolved
    // appointment already has one, create a fresh consultation for this visit.
    if (appointment) {
      const existingPrescription = await this.prescriptionRepo.findOne({
        where: { appointmentId: appointment.id },
      });

      if (existingPrescription && doctor) {
        appointment = await this.appointmentRepo.save(
          this.appointmentRepo.create({
            appointmentNumber: `OPD-${Date.now().toString().slice(-6)}`,
            patient,
            doctor,
            appointmentDate: new Date().toISOString().split('T')[0],
            timeSlot: appointment.timeSlot || '10:00 AM',
            status: AppointmentStatus.SCHEDULED,
          }),
        );
      }
    }

    // Mark appointment as COMPLETED
    if (appointment) {
      try {
        appointment.status = AppointmentStatus.COMPLETED;
        await this.appointmentRepo.save(appointment);
      } catch (e) {
        console.warn('Could not mark appointment COMPLETED', e);
      }
    }

    const medsList = Array.isArray(data.medicines) ? data.medicines : [];
    const adviceText = data.advice || '';
    const diagText = data.diagnosis || 'General Clinical Review';
    const sympText = data.symptoms || '';

    try {
      // 4. Create new prescription with appointment assigned directly
      const newPrescriptionPayload: any = {
        patient,
        patientId: patient.id,
        doctor,
        doctorId: doctor?.id,
        appointment,
        appointmentId: appointment?.id, // Satisfies table NOT NULL constraint
        diagnosis: diagText,
        symptoms: sympText,
        advice: adviceText,
        medicines: medsList,
      };

      const created = this.prescriptionRepo.create(newPrescriptionPayload as Prescription);
      return await this.prescriptionRepo.save(created);
    } catch (dbError: any) {
      console.error('CRITICAL: Prescription Save Error in Postgres:', dbError);
      throw new InternalServerErrorException(dbError?.message || 'Database error while saving prescription');
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