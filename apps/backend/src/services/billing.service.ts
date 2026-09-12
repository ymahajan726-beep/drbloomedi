import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Billing,
  PaymentMethod,
  PaymentStatus,
} from '../entities/billing.entity';
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
      relations: {
        patient: true,
        appointment: true,
      },
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
      relations: {
        patient: true,
        appointment: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill record not found');
    }

    return bill;
  }

  // 3. Create Manual Bill
  async create(body: any) {
    const patient = await this.patientRepo.findOne({
      where: { id: body.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

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
      lineItems: body.lineItems || [
        {
          itemDescription: 'Hospital Charges',
          amount: total,
        },
      ],
      paymentMethod: body.paymentMethod || PaymentMethod.CASH,
      paymentStatus: body.paymentStatus || PaymentStatus.PAID,
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

    return {
      message: 'Bill removed successfully',
    };
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
        relations: {
          doctor: true,
        },
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
        relations: {
          labTest: true,
        },
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
        relations: {
          bed: true,
        },
      });
    } catch {
      ipdAdmissions = [];
    }

    const lineItems: any[] = [];

    // Unique Doctor Consultation items
    const seenDoctorVisits = new Set<string>();

    appointments.forEach((apt: any) => {
      const docName =
        apt.doctor?.specialization || 'General OPD';

      const visitKey = `${
        docName
      }-${apt.appointmentDate || 'single'}`;

      if (!seenDoctorVisits.has(visitKey)) {
        seenDoctorVisits.add(visitKey);

        const fee = Number(
          apt.doctor?.consultationFee || 500,
        );

        lineItems.push({
          itemDescription: `Doctor Consultation (${docName})`,
          category: 'CONSULTATION',
          amount: fee,
        });
      }
    });

    // Pathology Tests
    labOrders.forEach((lab: any) => {
      const testTitle =
        lab.labTest?.testName ||
        'Diagnostic Pathology Test';

      const fee = Number(
        lab.labTest?.price || 400,
      );

      lineItems.push({
        itemDescription: `Pathology Test: ${testTitle}`,
        category: 'LAB',
        amount: fee,
      });
    });

    // IPD Admissions
    ipdAdmissions.forEach((ipd: any) => {
      const bedCharge = Number(
        ipd.bed?.pricePerDay || 1200,
      );

      lineItems.push({
        itemDescription: `IPD Bed: ${
          ipd.bed?.bedNumber || 'General Ward'
        }`,
        category: 'BED',
        amount: bedCharge,
      });
    });

    if (lineItems.length === 0) {
      lineItems.push({
        itemDescription:
          'Hospital General OPD Consultation',
        category: 'CONSULTATION',
        amount: 500,
      });
    }

    const subTotal = Number(
      lineItems
        .reduce(
          (acc, item) =>
            acc + Number(item.amount || 0),
          0,
        )
        .toFixed(2),
    );

    const gstAmount = Number(
      (subTotal * 0.05).toFixed(2),
    );

    const totalAmount = Number(
      (subTotal + gstAmount).toFixed(2),
    );

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

  // 7. Settle Consolidated Discharge Bill
  async settleDischargeBill(
    patientId: string,
    paymentMethodInput?: any,
    appointmentId?: string,
  ) {
    const summary =
      await this.getConsolidatedBill(patientId);

    /*
     * If appointmentId is supplied, verify that the
     * appointment actually belongs to this patient.
     */
    let appointment: Appointment | null = null;

    if (appointmentId) {
      appointment = await this.appointmentRepo.findOne({
        where: {
          id: appointmentId,
        },
        relations: {
          patient: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException(
          'Appointment not found',
        );
      }

      const appointmentPatientId =
        (appointment as any).patient?.id ||
        (appointment as any).patientId;

      if (appointmentPatientId !== patientId) {
        throw new NotFoundException(
          'Appointment does not belong to this patient',
        );
      }
    }

    /*
     * Convert frontend values such as:
     * CASH -> Cash
     * UPI -> UPI
     * CARD -> Card
     * INSURANCE -> Insurance
     * NET_BANKING -> Net Banking
     */
    const methodInput = String(
      paymentMethodInput || 'CASH',
    ).toUpperCase();

    let safeMethod: PaymentMethod;

    switch (methodInput) {
      case 'CASH':
        safeMethod = PaymentMethod.CASH;
        break;

      case 'UPI':
        safeMethod = PaymentMethod.UPI;
        break;

      case 'CARD':
        safeMethod = PaymentMethod.CARD;
        break;

      case 'INSURANCE':
        safeMethod = PaymentMethod.INSURANCE;
        break;

      case 'NET_BANKING':
      case 'NET BANKING':
      case 'NET-BANKING':
        safeMethod = PaymentMethod.NET_BANKING;
        break;

      default:
        safeMethod = PaymentMethod.CASH;
        break;
    }

    const billPayload: any = {
      invoiceNumber: `INV-${Date.now()}`,

      patient: summary.patient,

      doctor: appointment
        ? (appointment as any).doctor || null
        : null,

      /*
       * This is the important new connection.
       * The billing record will now belong to the
       * exact appointment that was paid.
       */
      appointment: appointment || null,

      lineItems: summary.lineItems,

      subTotal: summary.subTotal,

      gstAmount: summary.gstAmount,

      totalAmount: summary.totalAmount,

      amount: summary.totalAmount,

      paymentMethod: safeMethod,

      paymentStatus: PaymentStatus.PAID,
    };

    try {
      const bill =
        this.billingRepo.create(
          billPayload as Billing,
        );

      const savedBill =
        await this.billingRepo.save(bill);

      return savedBill;
    } catch (err: any) {
      /*
       * Keep the existing enum compatibility fallback.
       * This is only a fallback for an old database enum.
       */
      if (err?.code === '22P02') {
        billPayload.paymentMethod =
          safeMethod === PaymentMethod.CASH
            ? 'CASH'
            : safeMethod;

        billPayload.paymentStatus = 'PAID';

        const retryBill =
          this.billingRepo.create(
            billPayload as Billing,
          );

        return this.billingRepo.save(retryBill);
      }

      throw err;
    }
  }
}