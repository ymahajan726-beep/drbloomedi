
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

    const [appointments, billings, labOrders, prescriptions] =
      await Promise.all([
        this.appointmentRepo
          .find({
            where: { patient: { id: patientId } } as any,
            relations: { doctor: { user: true } },
            order: {
              appointmentDate: 'DESC',
              createdAt: 'DESC',
            },
          })
          .catch((): Appointment[] => []),

        this.billingRepo
          .find({
            where: { patient: { id: patientId } } as any,
            order: { createdAt: 'DESC' },
          })
          .catch((): Billing[] => []),

        this.labRepo
          .find({
            where: { patient: { id: patientId } } as any,
            relations: { labTest: true },
            order: { createdAt: 'DESC' },
          })
          .catch((): LabOrder[] => []),

        this.prescriptionRepo
          .find({
            where: { patient: { id: patientId } } as any,
            relations: { doctor: { user: true } },
            order: { createdAt: 'DESC' },
          })
          .catch((): Prescription[] => []),
      ]);

    const totalVisits = appointments.length;

    const totalInvoiced = (billings as any[]).reduce(
      (sum: number, b: any) =>
        sum + Number(b.totalAmount || b.amount || 0),
      0,
    );

    const totalPaid = (billings as any[])
      .filter((b: any) => b.paymentStatus === PaymentStatus.PAID)
      .reduce(
        (sum: number, b: any) =>
          sum + Number(b.totalAmount || b.amount || 0),
        0,
      );

    const outstandingBalance = Math.max(
      0,
      totalInvoiced - totalPaid,
    );

    const lastVisitDate =
      (appointments[0] as any)?.appointmentDate || null;

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

  // 2. Save Clinical Consultation
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
    // --------------------------------------------------
    // 1. Patient check
    // --------------------------------------------------
    const patient = await this.patientRepo.findOne({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    // --------------------------------------------------
    // 2. Doctor check
    // --------------------------------------------------
    let doctor = await this.doctorRepo.findOne({
      where: { id: Number(data.doctorId) || 1 },
      relations: { user: true },
    });

    if (!doctor) {
      const doctors = await this.doctorRepo.find({
        take: 1,
        relations: { user: true },
      });

      doctor = doctors[0];
    }

    // --------------------------------------------------
    // 3. Appointment check
    // --------------------------------------------------
    let appointment: Appointment | null = null;

    const cleanApptId = data.appointmentId
      ? String(data.appointmentId).trim()
      : undefined;

    if (cleanApptId) {
      appointment = await this.appointmentRepo.findOne({
        where: { id: cleanApptId as any },
      });

      if (appointment) {
        appointment.status = AppointmentStatus.COMPLETED;

        await this.appointmentRepo.save(appointment);
      }
    }

    // --------------------------------------------------
    // 4. Prepare consultation data
    // --------------------------------------------------
    const medsList =
      data.medications ||
      data.medicines ||
      [];

    const adviceText = [
      data.clinicalNotes,
      data.advice,
      data.nextVisitDate
        ? `Next Follow-up: ${data.nextVisitDate}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    // --------------------------------------------------
    // 5. Find existing prescription
    // --------------------------------------------------
    let prescription: Prescription | null = null;

    if (cleanApptId) {
      prescription = await this.prescriptionRepo.findOne({
        where: {
          appointmentId: cleanApptId,
        },
      });
    }

    // --------------------------------------------------
    // 6. UPDATE existing prescription
    // --------------------------------------------------
    if (prescription) {
      prescription.patientId = data.patientId;

      if (doctor) {
        prescription.doctor = doctor;
        prescription.doctorId = String(doctor.id);
      }

      prescription.diagnosis = data.diagnosis;

      prescription.symptoms =
        data.symptoms ||
        prescription.symptoms ||
        '';

      prescription.advice = adviceText;

      prescription.medicines = medsList;

      if (cleanApptId) {
        prescription.appointmentId = cleanApptId;
      }

      return await this.prescriptionRepo.save(prescription);
    }

    // --------------------------------------------------
    // 7. CREATE new prescription
    // --------------------------------------------------
    const newPrescription = this.prescriptionRepo.create({
      patientId: data.patientId,

      doctorId: doctor
        ? String(doctor.id)
        : undefined,

      appointmentId: cleanApptId,

      diagnosis: data.diagnosis,

      symptoms: data.symptoms || '',

      advice: adviceText,

      medicines: medsList,

      patient,

      doctor: doctor || undefined,

      appointment: appointment || undefined,
    } as any);

    return await this.prescriptionRepo.save(
      newPrescription,
    );
  }
}

