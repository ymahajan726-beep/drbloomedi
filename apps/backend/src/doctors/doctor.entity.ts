import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Doctor } from './doctor.entity';
import { User } from '../users/user.entity';
import { Department } from '../departments/department.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(data: {
    userId: number;
    specialization?: string;
    qualifications?: string;
    departmentId?: number;
    phone?: string;
  }) {
    const user = await this.userRepository.findOne({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let department: Department | null = null;

    if (data.departmentId) {
      department = await this.departmentRepository.findOne({
        where: {
          id: data.departmentId,
        },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    const doctor = this.doctorRepository.create({
      user,
      specialization: data.specialization,
      qualifications: data.qualifications,
      department: department ?? undefined,
      phone: data.phone,
    });

    return this.doctorRepository.save(doctor);
  }

  async findAll() {
    return this.doctorRepository.find({
      relations: {
        user: true,
        department: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const doctor = await this.doctorRepository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
        department: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async update(
    id: number,
    data: {
      specialization?: string;
      qualifications?: string;
      departmentId?: number;
      phone?: string;
      isActive?: boolean;
    },
  ) {
    const doctor = await this.findOne(id);

    if (data.departmentId !== undefined) {
      const department = await this.departmentRepository.findOne({
        where: {
          id: data.departmentId,
        },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }

      doctor.department = department;
    }

    if (data.specialization !== undefined) {
      doctor.specialization = data.specialization;
    }

    if (data.qualifications !== undefined) {
      doctor.qualifications = data.qualifications;
    }

    if (data.phone !== undefined) {
      doctor.phone = data.phone;
    }

    if (data.isActive !== undefined) {
      doctor.isActive = data.isActive;
    }

    return this.doctorRepository.save(doctor);
  }

  async remove(id: number) {
    const doctor = await this.findOne(id);

    await this.doctorRepository.remove(doctor);

    return {
      message: 'Doctor deleted successfully',
    };
  }
}