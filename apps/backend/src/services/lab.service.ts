import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LabOrder, LabOrderStatus } from '../entities/lab-order.entity';
import { LabTest } from '../entities/lab-test.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly labOrderRepo: Repository<LabOrder>,

    @InjectRepository(LabTest)
    private readonly labTestRepo: Repository<LabTest>,

    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async getAllTests() {
    return this.labTestRepo.find({
      order: {
        testName: 'ASC',
      },
    });
  }
  async createTest(data: {
    testName: string;
    price: number;
    normalRange?: string;
    unit?: string;
    description?: string;
  }) {
    const existingTest = await this.labTestRepo.findOne({
      where: {
        testName: data.testName,
      },
    });

    if (existingTest) {
      return existingTest;
    }

    const newTest = this.labTestRepo.create({
      testName: data.testName,
      price: Number(data.price) || 0,
      normalRange:
        data.normalRange || 'Standard reference range',
      unit: data.unit || '',
      description: data.description || '',
    });

    return this.labTestRepo.save(newTest);
  }

   async updateTest(
  id: string,
  data: {
    testName: string;
    price: number;
    normalRange?: string;
    unit?: string;
    description?: string;
  },
) {
  const test = await this.labTestRepo.findOne({
    where: { id },
  });

  if (!test) {
    throw new NotFoundException('Lab test not found');
  }

  const duplicateTest = await this.labTestRepo.findOne({
    where: { testName: data.testName },
  });

  if (duplicateTest && duplicateTest.id !== id) {
    throw new BadRequestException(
      'Another lab test with this name already exists',
    );
  }

  test.testName = data.testName;
  test.price = Number(data.price) || 0;
  test.normalRange =
    data.normalRange || 'Standard reference range';
  test.unit = data.unit || '';
  test.description = data.description || '';

  return this.labTestRepo.save(test);
}
  async getAllOrders() {
    return this.labOrderRepo.find({
      relations: {
        patient: true,
        doctor: true,
        labTest: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async bookTest(body: {
    patientId: string;
    labTestId: string;
    notes?: string;
  }) {
    const patient = await this.patientRepo.findOne({
      where: {
        id: body.patientId,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        'Patient not found',
      );
    }

    const labTest = await this.labTestRepo.findOne({
      where: {
        id: body.labTestId,
      },
    });

    if (!labTest) {
      throw new NotFoundException(
        'Lab test not found in laboratory catalog',
      );
    }

    const orderNumber =
      await this.generateOrderNumber();

    const newOrder: LabOrder =
      this.labOrderRepo.create({
        orderNumber,
        patient,
        labTest,
        status: LabOrderStatus.ORDERED,
        billedAmount: Number(
          labTest.price || 0,
        ),
      });

    return this.labOrderRepo.save(newOrder);
  }
  async updateSampleStatus(
    orderId: string,
    status: string,
  ) {
    const order =
      await this.labOrderRepo.findOne({
        where: {
          id: orderId,
        },
        relations: {
          patient: true,
          doctor: true,
          labTest: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Lab Order not found',
      );
    }

    const normalizedStatus =
      this.normalizeStatus(status);

    order.status = normalizedStatus;

    return this.labOrderRepo.save(order);
  }

  async submitReport(
    orderId: string,
    reportData: {
      observedValue: string;
      remarks?: string;
      reportFileUrl?: string;
    },
  ) {
    const order =
      await this.labOrderRepo.findOne({
        where: {
          id: orderId,
        },
        relations: {
          patient: true,
          doctor: true,
          labTest: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Lab Order not found',
      );
    }

    order.resultValue =
      reportData.observedValue || '';

    order.technicianRemarks =
      reportData.remarks || '';

    if (reportData.reportFileUrl) {
      order.reportFileUrl =
        reportData.reportFileUrl;
    }

    order.status =
      LabOrderStatus.COMPLETED;

    return this.labOrderRepo.save(order);
  }

  async getOrderById(orderId: string) {
    const order =
      await this.labOrderRepo.findOne({
        where: {
          id: orderId,
        },
        relations: {
          patient: true,
          doctor: true,
          labTest: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Lab Order not found',
      );
    }

    return order;
  }
  async createOrdersFromConsultation(data: {
    appointmentId: string;
    patientId: string;
    labTestIds: string[];
  }) {

    const patient =
      await this.patientRepo.findOne({
        where: {
          id: data.patientId,
        },
      });

    if (!patient) {
      throw new NotFoundException(
        'Patient not found',
      );
    }

    const appointment =
      await this.appointmentRepo.findOne({
        where: {
          id: data.appointmentId,
        },
        relations: {
          patient: true,
          doctor: true,
        },
      });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found',
      );
    }

    const doctor =
      appointment.doctor;

    if (!doctor) {
      throw new BadRequestException(
        'Doctor is not assigned to this appointment',
      );
    }


    if (
      !Array.isArray(data.labTestIds) ||
      data.labTestIds.length === 0
    ) {
      throw new BadRequestException(
        'At least one lab test is required',
      );
    }

    const createdOrders: LabOrder[] = [];

    for (const testId of data.labTestIds) {
      if (!testId) {
        continue;
      }

      const labTest =
        await this.labTestRepo.findOne({
          where: {
            id: String(testId),
          },
        });

      if (!labTest) {
        throw new NotFoundException(
          `Lab test not found: ${testId}`,
        );
      }

      const existingOrder =
        await this.labOrderRepo
          .createQueryBuilder('order')
          .leftJoin('order.patient', 'patient')
          .leftJoin('order.labTest', 'labTest')
          .where(
            'patient.id = :patientId',
            {
              patientId: patient.id,
            },
          )
          .andWhere(
            'labTest.id = :labTestId',
            {
              labTestId: labTest.id,
            },
          )
          .andWhere(
            'order.status != :cancelled',
            {
              cancelled:
                LabOrderStatus.CANCELLED,
            },
          )
          .getOne();

      if (existingOrder) {
        continue;
      }

      const orderNumber =
        await this.generateOrderNumber();

      const newOrder: LabOrder =
        this.labOrderRepo.create({
          orderNumber,
          patient,
          doctor,
          labTest,
          status:
            LabOrderStatus.ORDERED,
          billedAmount: Number(
            labTest.price || 0,
          ),
        });

      const savedOrder =
        await this.labOrderRepo.save(
          newOrder,
        );

      createdOrders.push(savedOrder);
    }

    return {
      success: true,

      message:
        createdOrders.length > 0
          ? `${createdOrders.length} lab order(s) created successfully.`
          : 'No new lab orders were created. Selected tests may already be ordered.',

      orders: createdOrders,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    let orderNumber = '';

    let exists = true;

    while (exists) {
      const timestamp =
        Date.now().toString();

      const random =
        Math.floor(
          1000 + Math.random() * 9000,
        ).toString();

      orderNumber =
        `LAB-${timestamp}-${random}`;

      const existing =
        await this.labOrderRepo.findOne({
          where: {
            orderNumber,
          },
        });

      exists = !!existing;
    }

    return orderNumber;
  }
  private normalizeStatus(
    status: string,
  ): LabOrderStatus {
    const value =
      String(status || '')
        .trim()
        .toLowerCase();

    switch (value) {
      case 'ordered':
      case 'pending':
        return LabOrderStatus.ORDERED;

      case 'sample collected':
      case 'collected':
      case 'sample_collected':
        return LabOrderStatus.SAMPLE_COLLECTED;

      case 'in progress':
      case 'in_process':
      case 'processing':
        return LabOrderStatus.IN_PROGRESS;

      case 'completed':
      case 'complete':
        return LabOrderStatus.COMPLETED;

      case 'cancelled':
      case 'canceled':
        return LabOrderStatus.CANCELLED;

      default:
        throw new BadRequestException(
          `Invalid lab order status: ${status}`,
        );
    }
  }
}