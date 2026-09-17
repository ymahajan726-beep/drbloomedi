import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billing, PaymentMethod, PaymentStatus } from '../entities/billing.entity';
import { Medicine } from '../entities/medicine.entity';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepo: Repository<Medicine>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
  ) {}

  async getInventory(search?: string) {
    const query = this.medicineRepo
      .createQueryBuilder('m')
      .orderBy('m.name', 'ASC');

    if (search) {
      query.where(
        'LOWER(m.name) LIKE :q OR LOWER(m.batchNumber) LIKE :q',
        { q: `%${search.toLowerCase()}%` },
      );
    }

    const items = await query.getMany();
    const today = new Date();

    return items.map((med) => {
      const isExpired = med.expiryDate
        ? new Date(med.expiryDate) <= today
        : false;

      return {
        ...med,
        isExpired,
        isLowStock: Number(med.stockQuantity || 0) <= 15,
      };
    });
  }

  async addMedicine(data: {
    name: string;
    genericName?: string;
    batchNumber: string;
    stockQuantity: number;
    unitPrice: number;
    expiryDate: string;
  }) {
    const medicine = this.medicineRepo.create({
      name: data.name,
      genericName: data.genericName || '',
      batchNumber: data.batchNumber,
      stockQuantity: Number(data.stockQuantity) || 0,
      unitPrice: Number(data.unitPrice) || 0,
      expiryDate: new Date(data.expiryDate),
    } as any);

    return this.medicineRepo.save(medicine);
  }

  async getPharmacyAlerts() {
    const today = new Date();
    const allMeds = await this.medicineRepo.find();

    const lowStock = allMeds.filter(
      (medicine) => Number(medicine.stockQuantity || 0) <= 15,
    );

    const expired = allMeds.filter(
      (medicine) =>
        medicine.expiryDate && new Date(medicine.expiryDate) <= today,
    );

    return {
      lowStockCount: lowStock.length,
      expiredCount: expired.length,
      lowStockItems: lowStock,
      expiredItems: expired,
    };
  }

  async processSaleAndBill(data: {
    patientId: string;
    items: Array<{ medicineId: string; quantity: number }>;
    paymentMethod?: string;
  }) {
    const patient = await this.patientRepo.findOne({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    if (!data.items?.length) {
      throw new BadRequestException(
        'At least one medicine must be added for dispensing',
      );
    }

    const lineItems: any[] = [];
    let subTotal = 0;

    for (const item of data.items) {
      const medicine = await this.medicineRepo.findOne({
        where: { id: item.medicineId },
      });

      if (!medicine) {
        throw new NotFoundException(
          `Medicine not found: ${item.medicineId}`,
        );
      }

      const quantity = Number(item.quantity) || 1;

      if (Number(medicine.stockQuantity || 0) < quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${medicine.name}". Available: ${medicine.stockQuantity}, Requested: ${quantity}`,
        );
      }

      medicine.stockQuantity =
        Number(medicine.stockQuantity) - quantity;

      await this.medicineRepo.save(medicine);

      const unitPrice = Number(medicine.unitPrice || 0);
      const itemTotal = Number((unitPrice * quantity).toFixed(2));

      subTotal += itemTotal;

      lineItems.push({
        itemDescription: `${medicine.name} (Batch: ${
          medicine.batchNumber || 'N/A'
        }) x${quantity}`,
        category: 'PHARMACY',
        unitPrice,
        quantity,
        amount: itemTotal,
      });
    }

    const gstAmount = Number((subTotal * 0.05).toFixed(2));
    const totalAmount = Number((subTotal + gstAmount).toFixed(2));

    const methodStr = String(data.paymentMethod || 'Cash');

    const safeMethod =
      PaymentMethod?.CASH ||
      (methodStr.toUpperCase() === 'CASH' ? 'Cash' : methodStr);

    const safeStatus = PaymentStatus?.PAID || 'Paid';

    const billPayload: any = {
      invoiceNumber: `PHARM-INV-${Date.now()}`,
      patient,
      lineItems,
      subTotal,
      gstAmount,
      totalAmount,
      amount: totalAmount,
      paymentMethod: safeMethod,
      paymentStatus: safeStatus,
    };

    try {
      const newBill = this.billingRepo.create(
        billPayload as Billing,
      );

      const savedBill = await this.billingRepo.save(newBill);

      return {
        bill: savedBill,
        invoiceNumber: billPayload.invoiceNumber,
        patient,
        lineItems,
        subTotal,
        gstAmount,
        totalAmount,
        issuedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      if (err?.code === '22P02') {
        billPayload.paymentMethod = 'CASH';
        billPayload.paymentStatus = 'PAID';

        const retryBill = this.billingRepo.create(
          billPayload as Billing,
        );

        const savedBill = await this.billingRepo.save(retryBill);

        return {
          bill: savedBill,
          invoiceNumber: billPayload.invoiceNumber,
          patient,
          lineItems,
          subTotal,
          gstAmount,
          totalAmount,
          issuedAt: new Date().toISOString(),
        };
      }

      throw new InternalServerErrorException(
        err.message || 'Billing failed',
      );
    }
  }
}
