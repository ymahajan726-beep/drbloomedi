import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Medicine } from '../entities/medicine.entity';

@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepo: Repository<Medicine>,
  ) {}

  async findAll(search?: string, category?: string): Promise<Medicine[]> {
    const qb = this.medicineRepo.createQueryBuilder('med').orderBy('med.name', 'ASC');

    if (search) {
      qb.andWhere(
        '(med.name ILIKE :search OR med.genericName ILIKE :search OR med.batchNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      qb.andWhere('med.category = :category', { category });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Medicine> {
    const med = await this.medicineRepo.findOne({ where: { id } });
    if (!med) throw new NotFoundException('Medicine not found in inventory');
    return med;
  }

  async create(data: Partial<Medicine>): Promise<Medicine> {
    const existing = await this.medicineRepo.findOne({ where: { name: data.name } });
    if (existing) {
      throw new BadRequestException(`Medicine "${data.name}" already exists in inventory`);
    }

    const med = this.medicineRepo.create({
      ...data,
      stockQuantity: Number(data.stockQuantity) || 0,
      minStockAlert: Number(data.minStockAlert) || 10,
      unitPrice: Number(data.unitPrice) || 0,
    });

    return this.medicineRepo.save(med);
  }

  async update(id: string, data: Partial<Medicine>): Promise<Medicine> {
    const med = await this.findOne(id);
    Object.assign(med, {
      ...data,
      stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : med.stockQuantity,
      unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : med.unitPrice,
    });
    return this.medicineRepo.save(med);
  }

  // दवा डिस्पेंस करने पर स्टॉक घटाना (Stock Deduction)
  async dispense(id: string, quantity: number): Promise<Medicine> {
    const med = await this.findOne(id);
    const qty = Number(quantity);

    if (qty <= 0) {
      throw new BadRequestException('Dispense quantity must be greater than zero');
    }

    if (med.stockQuantity < qty) {
      throw new BadRequestException(
        `Insufficient stock for ${med.name}. Available: ${med.stockQuantity}, Requested: ${qty}`,
      );
    }

    med.stockQuantity -= qty;
    return this.medicineRepo.save(med);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await this.medicineRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Medicine not found');
    return { success: true, message: 'Medicine removed from inventory' };
  }
}