import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTest } from '../entities/lab-test.entity';
import { LabOrder, LabOrderStatus } from '../entities/lab-order.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(LabTest)
    private readonly labTestRepo: Repository<LabTest>,
    @InjectRepository(LabOrder)
    private readonly labOrderRepo: Repository<LabOrder>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  // 1. LAB TEST CATALOG
  async getAllTests(category?: string): Promise<LabTest[]> {
    const qb = this.labTestRepo.createQueryBuilder('test').orderBy('test.testName', 'ASC');
    if (category) {
      qb.andWhere('test.category = :category', { category });
    }
    return qb.getMany();
  }

  async createTest(data: Partial<LabTest>): Promise<LabTest> {
    if (!data.testName || !data.testName.trim()) {
      throw new BadRequestException('Test name is mandatory');
    }

    const trimmed = data.testName.trim();
    const existing = await this.labTestRepo.findOne({ where: { testName: trimmed } });
    if (existing) {
      throw new ConflictException(`Lab Test "${trimmed}" already exists`);
    }

    const test = this.labTestRepo.create({
      ...data,
      testName: trimmed,
      price: Math.max(0, Number(data.price) || 0),
    });
    return this.labTestRepo.save(test);
  }

  // 2. LAB ORDERS
  async getAllOrders(search?: string, status?: string): Promise<LabOrder[]> {
    const qb = this.labOrderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.patient', 'patient')
      .leftJoinAndSelect('order.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('order.labTest', 'labTest')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(order.orderNumber ILIKE :search OR patient.fullName ILIKE :search OR patient.phone ILIKE :search OR labTest.testName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.getMany();
  }

  async findOneOrder(id: string): Promise<LabOrder> {
    const order = await this.labOrderRepo.findOne({
      where: { id },
      relations: {
        patient: true,
        doctor: { user: true },
        labTest: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Lab order #${id} not found`);
    }
    return order;
  }

  async createOrder(data: {
    patientId: string;
    doctorId?: number;
    labTestId: string;
  }): Promise<LabOrder> {
    if (!data.patientId || !data.labTestId) {
      throw new BadRequestException('Patient ID and Lab Test ID are mandatory');
    }

    const patient = await this.patientRepo.findOne({ where: { id: data.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const labTest = await this.labTestRepo.findOne({ where: { id: data.labTestId } });
    if (!labTest) throw new NotFoundException('Lab test not found');

    let doctor: Doctor | null = null;
    if (data.doctorId) {
      doctor = await this.doctorRepo.findOne({ where: { id: data.doctorId } });
    }

    const timestamp = Date.now().toString().slice(-6);
    const randomHex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
    const orderNumber = `LAB-${new Date().getFullYear()}-${timestamp}-${randomHex}`;

    const order = this.labOrderRepo.create({
      orderNumber,
      patient,
      doctor: doctor || undefined,
      labTest,
      billedAmount: Number(labTest.price) || 0,
      status: LabOrderStatus.ORDERED,
    });

    return this.labOrderRepo.save(order);
  }

  async updateOrderStatus(id: string, newStatus: LabOrderStatus): Promise<LabOrder> {
    const order = await this.findOneOrder(id);

    if (order.status === LabOrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot modify a cancelled lab order');
    }

    if (newStatus === LabOrderStatus.COMPLETED && !order.resultValue && !order.reportFileUrl) {
      throw new BadRequestException('Cannot mark order as COMPLETED without recording test results or attaching a report');
    }

    order.status = newStatus;
    return this.labOrderRepo.save(order);
  }

  async recordResult(
    id: string,
    resultValue: string,
    technicianRemarks?: string,
    isAbnormal: boolean = false,
    reportFileUrl?: string,
  ): Promise<LabOrder> {
    if ((!resultValue || !resultValue.trim()) && !reportFileUrl) {
      throw new BadRequestException('Either diagnostic result value or report file attachment is required');
    }

    const order = await this.findOneOrder(id);

    if (order.status === LabOrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot add test results to a cancelled order');
    }

    order.resultValue = resultValue ? resultValue.trim() : '';
    order.technicianRemarks = technicianRemarks ? technicianRemarks.trim() : '';
    order.isAbnormal = Boolean(isAbnormal);
    if (reportFileUrl) {
      order.reportFileUrl = reportFileUrl.trim();
    }
    order.status = LabOrderStatus.COMPLETED;

    return this.labOrderRepo.save(order);
  }
}