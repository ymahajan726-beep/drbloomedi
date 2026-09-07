import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Billing, PaymentStatus } from '../entities/billing.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { Prescription } from '../entities/prescription.entity';

@Injectable()
export class EmrService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
    @InjectRepository(LabOrder)
    private readonly labRepo: Repository<LabOrder>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
  ) {}

  // 1. Get Comprehensive Patient 360 Dossier
  async getPatientDossier(patientId: string) {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    const [appointments, billings, labOrders, prescriptions] = await Promise.all([
      this.appointmentRepo.find({
        where: { patient: { id: patientId } } as any,
        relations: { doctor: { user: true } },
        order: { appointmentDate: 'DESC', createdAt: 'DESC' },
      }).catch((): Appointment[] => []),

      this.billingRepo.find({
        where: { patient: { id: patientId } } as any,
        order: { createdAt: 'DESC' },
      }).catch((): Billing[] => []),

      this.labRepo.find({
        where: { patient: { id: patientId } } as any,
        relations: { labTest: true },
        order: { createdAt: 'DESC' },
      }).catch((): LabOrder[] => []),

      this.prescriptionRepo.find({
        where: { patient: { id: patientId } } as any,
        relations: { doctor: { user: true } },
        order: { createdAt: 'DESC' },
      }).catch((): Prescription[] => []),
    ]);

    const totalVisits: number = appointments.length;

    const totalInvoiced: number = (billings as any[]).reduce(
      (sum: number, b: any): number => sum + Number(b.totalAmount || b.amount || 0),
      0,
    );

    const totalPaid: number = (billings as any[])
      .filter((b: any) => b.paymentStatus === PaymentStatus.PAID)
      .reduce(
        (sum: number, b: any): number => sum + Number(b.totalAmount || b.amount || 0),
        0,
      );

    const outstandingBalance: number = Math.max(0, totalInvoiced - totalPaid);

    const lastVisitDate = (appointments[0] as any)?.appointmentDate || null;

    return {
      patient,
      stats: {
        totalVisits,
        lastVisitDate,
        totalInvoiced: Number(totalInvoiced.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        outstandingBalance: Number(outstandingBalance.toFixed(2)),
        totalPrescriptions: prescriptions.length,
        totalLabOrders: labOrders.length,
      },
      appointments,
      prescriptions,
      labOrders,
      billings,
    };
  }

  // 2. Save Clinical Consultation (Fixes 23505 Duplicate Appointment Error)
  async saveConsultation(data: {
    patientId: string;
    doctorId: number | string;
    appointmentId?: string | number;
    diagnosis: string;
    clinicalNotes?: string;
    symptoms?: string;
    advice?: string;
    nextVisitDate?: string;
    consultationFee?: number;
    medications?: any[];
    medicines?: any[];
    labTestsSuggested?: any[];
  }) {
    // 1. Patient check
    const patient = await this.patientRepo.findOne({
      where: { id: data.patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    // 2. Doctor check (fallback to first doctor if ID not matched)
    let doctor = await this.doctorRepo.findOne({
      where: { id: Number(data.doctorId) || 1 },
      relations: { user: true },
    });
    if (!doctor) {
      const doctors = await this.doctorRepo.find({ take: 1, relations: { user: true } });
      doctor = doctors[0];
    }

    // 3. Mark appointment COMPLETED
    let appointment: Appointment | null = null;
    const cleanApptId = data.appointmentId ? String(data.appointmentId) : undefined;

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

    // 4. UPSERT Check: Agar is appointmentId ki prescription pehle se hai toh UPDATE karein
    let prescription: Prescription | null = null;
    if (cleanApptId) {
      prescription = await this.prescriptionRepo.findOne({
        where: { appointment: { id: cleanApptId } } as any,
      });
    }

    const medsList = data.medications || data.medicines || [];
    const adviceText = [data.clinicalNotes, data.advice, data.nextVisitDate ? `Next Follow-up: ${data.nextVisitDate}` : '']
      .filter(Boolean)
      .join('\n');

    if (prescription) {
      // UPDATE existing record to prevent unique constraint crash
      prescription.diagnosis = data.diagnosis;
      prescription.symptoms = data.symptoms || prescription.symptoms || '';
      prescription.advice = adviceText;
      prescription.medicines = medsList;
      if (doctor) prescription.doctor = doctor;
      return await this.prescriptionRepo.save(prescription);
    }

    // CREATE new record
    const newPrescription = this.prescriptionRepo.create({
      patient,
      doctor: doctor || undefined,
      appointment: appointment || undefined,
      diagnosis: data.diagnosis,
      symptoms: data.symptoms || '',
      advice: adviceText,
      medicines: medsList,
    } as any);

    return await this.prescriptionRepo.save(newPrescription);
  }
}