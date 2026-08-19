import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Department } from './department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(data: {
    name: string;
    description?: string;
  }): Promise<Department> {
    const department = this.departmentRepository.create({
      name: data.name,
      description: data.description,
    });

    return this.departmentRepository.save(department);
  }

  async findAll(): Promise<Department[]> {
    return this.departmentRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<Department> {
    const department = await this.findOne(id);

    Object.assign(department, data);

    return this.departmentRepository.save(department);
  }

  async remove(id: number): Promise<void> {
    const department = await this.findOne(id);

    await this.departmentRepository.remove(department);
  }
}