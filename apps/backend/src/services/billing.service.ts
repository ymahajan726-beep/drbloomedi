import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billing, PaymentStatus, PaymentMethod } from '../entities/billing.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async findAll(search?: string, status?: string): Promise<Billing[]> {
    const qb = this.billingRepo
      .createQueryBuilder('billing')
      .leftJoinAndSelect('billing.patient', 'patient')
      .leftJoinAndSelect('billing.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .orderBy('billing.createdAt', 'DESC');

    if (status) {
      qb.andWhere('billing.paymentStatus = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(patient.fullName ILIKE :search OR billing.invoiceNumber ILIKE :search OR doctorUser.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Billing> {
    const bill = await this.billingRepo.findOne({
      where: { id },
      relations: {
        patient: true,
        doctor: { user: true },
      },
    });
    if (!bill) throw new NotFoundException('Invoice not found');
    return bill;
  }

  async create(data: {
    patientId: string;
    doctorId?: number;
    consultationFee: number;
    treatmentCharges: number;
    medicineCharges: number;
    discount: number;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Promise<Billing> {
    const patient = await this.patientRepo.findOne({ where: { id: data.patientId } });
    if (!patient) throw new NotFoundException('Patient record not found');

    let doctor: Doctor | null = null;
    if (data.doctorId) {
      doctor = await this.doctorRepo.findOne({ where: { id: data.doctorId } });
    }

    const conFee = Number(data.consultationFee) || 0;
    const treatFee = Number(data.treatmentCharges) || 0;
    const medFee = Number(data.medicineCharges) || 0;
    const disc = Number(data.discount) || 0;

    const totalAmount = Math.max(0, conFee + treatFee + medFee - disc);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${randomSuffix}`;

    const billing = this.billingRepo.create({
      invoiceNumber,
      consultationFee: conFee,
      treatmentCharges: treatFee,
      medicineCharges: medFee,
      discount: disc,
      totalAmount,
      paymentStatus: data.paymentStatus || PaymentStatus.PENDING,
      paymentMethod: data.paymentMethod || PaymentMethod.CASH,
      notes: data.notes,
      patient,
      doctor: doctor || undefined,
    });

    return this.billingRepo.save(billing);
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Billing> {
    const bill = await this.findOne(id);
    bill.paymentStatus = status;
    return this.billingRepo.save(bill);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await this.billingRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Invoice not found');
    return { success: true, message: 'Invoice removed successfully' };
  }
}