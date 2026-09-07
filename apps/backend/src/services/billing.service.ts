import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billing, PaymentMethod, PaymentStatus } from '../entities/billing.entity';
import { Patient } from '../entities/patient.entity';
import { Appointment } from '../entities/appointment.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { IpdAdmission } from '../entities/ipd-admission.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(LabOrder)
    private readonly labRepo: Repository<LabOrder>,
    @InjectRepository(IpdAdmission)
    private readonly ipdRepo: Repository<IpdAdmission>,
  ) {}

  // 1. Admin Billing List (findAll)
  async findAll(search?: string, status?: string) {
    const whereCondition: any = {};
    if (status) {
      whereCondition.paymentStatus = status;
    }

    const bills = await this.billingRepo.find({
      where: whereCondition,
      relations: { patient: true },
      order: { createdAt: 'DESC' },
    });

    if (search) {
      const q = search.toLowerCase();
      return bills.filter(
        (b) =>
          b.invoiceNumber?.toLowerCase().includes(q) ||
          b.patient?.fullName?.toLowerCase().includes(q) ||
          b.patient?.phone?.includes(q),
      );
    }

    return bills;
  }

  // 2. Single Bill Details (findOne)
  async findOne(id: string) {
    const bill = await this.billingRepo.findOne({
      where: { id },
      relations: { patient: true },
    });
    if (!bill) throw new NotFoundException('Bill record not found');
    return bill;
  }

  // 3. Create Manual Bill
  async create(body: any) {
    const patient = await this.patientRepo.findOne({ where: { id: body.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const total = Number(body.totalAmount || body.amount || 0);
    const subTotal = Number((total / 1.05).toFixed(2));
    const gst = Number((total - subTotal).toFixed(2));

    const billPayload: any = {
      invoiceNumber: `INV-${Date.now()}`,
      patient,
      amount: total,
      totalAmount: total,
      subTotal: subTotal,
      gstAmount: gst,
      lineItems: body.lineItems || [{ itemDescription: 'Hospital Charges', amount: total }],
      paymentMethod: body.paymentMethod || PaymentMethod.CASH || 'CASH',
      paymentStatus: body.paymentStatus || PaymentStatus.PAID || 'PAID',
    };

    const newBill = this.billingRepo.create(billPayload as Billing);
    return this.billingRepo.save(newBill);
  }

  // 4. Update Status
  async updateStatus(id: string, status: PaymentStatus) {
    const bill = await this.findOne(id);
    bill.paymentStatus = status;
    return this.billingRepo.save(bill);
  }

  // 5. Delete Bill
  async delete(id: string) {
    const bill = await this.findOne(id);
    await this.billingRepo.remove(bill);
    return { message: 'Bill removed successfully' };
  }

  // 6. Complete Consolidated Discharge Bill Calculation
  async getConsolidatedBill(patientId: string) {
    if (!patientId) {
      throw new NotFoundException('Patient ID is required');
    }

    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    // A. Appointments Safely Fetch
    let appointments: any[] = [];
    try {
      appointments = await this.appointmentRepo.find({
        where: [
          { patient: { id: patientId } },
          { patientId: patientId },
        ] as any,
        relations: { doctor: true },
      });
    } catch {
      appointments = [];
    }

    // B. Lab Orders Safely Fetch
    let labOrders: any[] = [];
    try {
      labOrders = await this.labRepo.find({
        where: [
          { patient: { id: patientId } },
          { patientId: patientId },
        ] as any,
        relations: { labTest: true },
      });
    } catch {
      labOrders = [];
    }

    // C. IPD Admissions Safely Fetch
    let ipdAdmissions: any[] = [];
    try {
      ipdAdmissions = await this.ipdRepo.find({
        where: [
          { patient: { id: patientId } },
          { patientId: patientId },
        ] as any,
        relations: { bed: true },
      });
    } catch {
      ipdAdmissions = [];
    }

    const lineItems: any[] = [];

    // Unique Doctor Consultation items
    const seenDoctorVisits = new Set<string>();
    appointments.forEach((apt: any) => {
      const docName = apt.doctor?.specialization || 'General OPD';
      const visitKey = `${docName}-${apt.appointmentDate || 'single'}`;

      if (!seenDoctorVisits.has(visitKey)) {
        seenDoctorVisits.add(visitKey);
        const fee = Number(apt.doctor?.consultationFee || 500);
        lineItems.push({
          itemDescription: `Doctor Consultation (${docName})`,
          category: 'CONSULTATION',
          amount: fee,
        });
      }
    });

    // Pathology Tests
    labOrders.forEach((lab: any) => {
      const testTitle = lab.labTest?.testName || 'Diagnostic Pathology Test';
      const fee = Number(lab.labTest?.price || 400);
      lineItems.push({
        itemDescription: `Pathology Test: ${testTitle}`,
        category: 'LAB',
        amount: fee,
      });
    });

    // IPD Admissions
    ipdAdmissions.forEach((ipd: any) => {
      const bedCharge = Number(ipd.bed?.pricePerDay || 1200);
      lineItems.push({
        itemDescription: `IPD Bed: ${ipd.bed?.bedNumber || 'General Ward'}`,
        category: 'BED',
        amount: bedCharge,
      });
    });

    if (lineItems.length === 0) {
      lineItems.push({
        itemDescription: 'Hospital General OPD Consultation',
        category: 'CONSULTATION',
        amount: 500,
      });
    }

    const subTotal = Number(
      lineItems.reduce((acc, item) => acc + Number(item.amount || 0), 0).toFixed(2),
    );
    const gstAmount = Number((subTotal * 0.05).toFixed(2));
    const totalAmount = Number((subTotal + gstAmount).toFixed(2));

    return {
      patient,
      lineItems,
      appointmentCount: appointments.length,
      labOrdersCount: labOrders.length,
      ipdAdmissionsCount: ipdAdmissions.length,
      subTotal,
      gstAmount,
      totalAmount,
      grandTotal: totalAmount,
      invoiceDate: new Date().toISOString(),
    };
  }

  // Alias
  async getConsolidatedPatientBill(patientId: string) {
    return this.getConsolidatedBill(patientId);
  }

  // 7. Settle Consolidated Bill (Fixes 22P02 Enum Error & Syntax)
  async settleDischargeBill(
    patientId: string,
    paymentMethodInput?: any,
  ) {
    const summary = await this.getConsolidatedBill(patientId);

    // Initial attempt using entity Enum values or safe fallbacks
    const methodStr = String(paymentMethodInput || 'Cash');
    const safeMethod =
      PaymentMethod?.CASH ||
      (methodStr.toUpperCase() === 'CASH' ? 'Cash' : methodStr);

    const safeStatus =
      PaymentStatus?.PAID ||
      'Paid';

    const billPayload: any = {
      invoiceNumber: `INV-${Date.now()}`,
      patient: summary.patient,
      lineItems: summary.lineItems,
      subTotal: summary.subTotal,
      gstAmount: summary.gstAmount,
      totalAmount: summary.totalAmount,
      amount: summary.totalAmount,
      paymentMethod: safeMethod,
      paymentStatus: safeStatus,
    };

    try {
      const bill = this.billingRepo.create(billPayload as Billing);
      return await this.billingRepo.save(bill);
    } catch (err: any) {
      // Agar DB enum UPPERCASE expect kar raha ho aur TitleCase fail ho (Code 22P02)
      if (err?.code === '22P02') {
        billPayload.paymentMethod = 'CASH';
        billPayload.paymentStatus = 'PAID';
        const retryBill = this.billingRepo.create(billPayload as Billing);
        return await this.billingRepo.save(retryBill);
      }
      throw err;
    }
  }
}