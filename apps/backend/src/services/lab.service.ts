import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LabOrder } from '../entities/lab-order.entity';
import { LabTest } from '../entities/lab-test.entity';
import { Patient } from '../entities/patient.entity';
import { Billing } from '../entities/billing.entity';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly labOrderRepo: Repository<LabOrder>,
    @InjectRepository(LabTest)
    private readonly labTestRepo: Repository<LabTest>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. Get all Available Tests Catalog
  async getAllTests() {
    return this.labTestRepo.find({
      order: { testName: 'ASC' },
    });
  }

  // 2. Create New Test in Catalog
  async createTest(data: {
    testName: string;
    price: number;
    normalRange?: string;
    unit?: string;
    description?: string;
  }) {
    const newTest = this.labTestRepo.create({
      testName: data.testName,
      price: Number(data.price) || 0,
      normalRange: data.normalRange || 'Standard reference range',
      unit: data.unit || '',
    } as any);

    return this.labTestRepo.save(newTest);
  }

  // 3. Get All Orders (Lab Worklist Queue - Sorted Old to New / FIFO)
  async getAllOrders() {
    return this.labOrderRepo.find({
      relations: {
        patient: true,
        labTest: true,
      },
      order: { createdAt: 'ASC' }, // Oldest first (FIFO sequence)
    });
  }

  // 4. Book New Lab Test Order
  async bookTest(body: { patientId: string; labTestId: string; notes?: string }) {
    const patient = await this.patientRepo.findOne({
      where: { id: body.patientId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const labTest = await this.labTestRepo.findOne({
      where: { id: body.labTestId },
    });
    if (!labTest) throw new NotFoundException('Lab test not found');

    const newOrder = this.labOrderRepo.create({
      patient,
      labTest,
      status: 'PENDING',
    } as any);

    return this.labOrderRepo.save(newOrder);
  }

  // 5. Update Sample Collection Status (Pending -> Collected -> In Process)
  async updateSampleStatus(orderId: string, status: string) {
    const order = await this.labOrderRepo.findOne({
      where: { id: orderId },
      relations: { patient: true, labTest: true },
    });
    if (!order) throw new NotFoundException('Lab Order not found');

    order.status = status as any;
    return this.labOrderRepo.save(order);
  }

  // 6. Submit Findings, Observed Values & Generate Report (PDF Upload support)
  async submitReport(
    orderId: string,
    reportData: {
      observedValue: string;
      remarks?: string;
      reportFileUrl?: string; // PDF report link
    },
  ) {
    const order = await this.labOrderRepo.findOne({
      where: { id: orderId },
      relations: { patient: true, labTest: true },
    });
    if (!order) throw new NotFoundException('Lab Order not found');

    (order as any).resultValue = reportData.observedValue;
    (order as any).remarks = reportData.remarks || 'Test completed and verified by laboratory technician.';
    if (reportData.reportFileUrl) {
      (order as any).reportFileUrl = reportData.reportFileUrl;
    }
    order.status = 'COMPLETED' as any;

    return this.labOrderRepo.save(order);
  }

  // 7. Get Single Order / Report Detail (For PDF & Online Access)
  async getOrderById(orderId: string) {
    const order = await this.labOrderRepo.findOne({
      where: { id: orderId },
      relations: { patient: true, labTest: true },
    });
    if (!order) throw new NotFoundException('Lab Order not found');
    return order;
  }

  // 8. Doctor Prescription se Lab Orders create karna aur Billing mein fee add karna
  async createOrdersFromConsultation(data: {
    appointmentId: string;
    patientId: string;
    labTestIds: string[];
  }) {
    const patient = await this.patientRepo.findOne({ where: { id: data.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const createdOrders: any[] = [];
    let additionalAmount = 0;

    for (const item of data.labTestIds) {
      // ID ya Test Name dono se search karega taaki mismatch na ho
      let labTest = await this.labTestRepo.findOne({
        where: [{ id: item }, { testName: item }] as any,
      });

      // Agar catalog mein nahi mila, toh safety ke liye auto-create kar lega
      if (!labTest) {
        const newLabTest = this.labTestRepo.create({
          testName: item,
          price: 350,
          normalRange: 'Standard',
          unit: '',
        });
        labTest = await this.labTestRepo.save(newLabTest as any) as LabTest;
      }

      if (labTest) {
        additionalAmount += Number(labTest.price || 350);

        const newOrder = this.labOrderRepo.create({
          patient,
          labTest,
          status: 'PENDING',
        } as any);

        const savedOrder = await this.labOrderRepo.save(newOrder);
        createdOrders.push(savedOrder);
      }
    }

    // Auto-update Billing Desk total amount if bill exists for this appointment
    try {
      const billRepo = this.dataSource.getRepository(Billing);
      const bill = await billRepo.findOne({ where: { appointment: { id: data.appointmentId } } as any });
      if (bill) {
        bill.totalAmount = Number(bill.totalAmount || 0) + additionalAmount;
        await billRepo.save(bill);
      }
    } catch (e) {
      console.warn('Could not auto-update billing amount for lab tests:', e);
    }

    return {
      success: true,
      message: `${createdOrders.length} lab orders created and fees added to billing successfully.`,
      orders: createdOrders,
    };
  }
}