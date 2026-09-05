import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { Appointment } from '../entities/appointment.entity';
import { Prescription } from '../entities/prescription.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { Billing } from '../entities/billing.entity';

@Injectable()
export class EmrService {
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
  ) {}

  async getPatientTimeline(patientId: string) {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient #${patientId} not found`);
    }

    // 1. Appointments (safe query)
    let appointments: Appointment[] = [];
    try {
      appointments = await this.appointmentRepo.find({
        where: { patient: { id: patientId } },
        relations: { doctor: { user: true } },
        order: { appointmentDate: 'DESC' },
      });
    } catch {
      appointments = [];
    }

    // 2. Prescriptions (safe query)
    let prescriptions: Prescription[] = [];
    try {
      prescriptions = await this.prescriptionRepo.find({
        where: { patient: { id: patientId } },
        relations: { doctor: { user: true } },
        order: { createdAt: 'DESC' },
      });
    } catch {
      prescriptions = [];
    }

    // 3. Lab Orders (safe query)
    let labOrders: LabOrder[] = [];
    try {
      labOrders = await this.labOrderRepo.find({
        where: { patient: { id: patientId } },
        relations: { labTest: true, doctor: { user: true } },
        order: { createdAt: 'DESC' },
      });
    } catch {
      labOrders = [];
    }

    // 4. Billings (safe query)
    let billings: any[] = [];
    try {
      billings = await this.billingRepo.find({
        where: { patient: { id: patientId } },
        order: { createdAt: 'DESC' },
      });
    } catch {
      billings = [];
    }

    const totalSpent = billings.reduce((sum, b) => {
      const amt = Number(b.totalAmount || b.amount || b.paidAmount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    return {
      patient,
      summary: {
        totalVisits: appointments.length,
        totalPrescriptions: prescriptions.length,
        totalLabOrders: labOrders.length,
        totalBills: billings.length,
        totalSpent,
      },
      records: {
        appointments,
        prescriptions,
        labOrders,
        billings,
      },
    };
  }
}