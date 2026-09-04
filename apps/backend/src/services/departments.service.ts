import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async findAll(): Promise<Department[]> {
    return this.deptRepo.find({
      relations: { doctors: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Department> {
    const dept = await this.deptRepo.findOne({
      where: { id },
      relations: { doctors: true },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async create(data: Partial<Department>): Promise<Department> {
    const existing = await this.deptRepo.findOne({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException('Department with this name already exists');
    }
    const dept = this.deptRepo.create(data);
    return this.deptRepo.save(dept);
  }

  async update(id: string, data: Partial<Department>): Promise<Department> {
    const dept = await this.findOne(id);
    Object.assign(dept, data);
    return this.deptRepo.save(dept);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await this.deptRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Department not found');
    return { success: true, message: 'Department removed successfully' };
  }
}