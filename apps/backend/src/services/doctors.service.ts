
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { Repository } from 'typeorm';

import {
  Doctor,
} from '../entities/doctor.entity';

import {
  User,
  UserRole,
} from '../entities/user.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // =====================================================
  // GET ALL DOCTORS
  // =====================================================

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: {
        user: true,
      },

      order: {
        id: 'ASC',
      },
    });
  }

  // =====================================================
  // GET DOCTOR BY ID
  // =====================================================

  async findById(
    id: number,
  ): Promise<Doctor> {
    const doctor =
      await this.doctorRepository.findOne({
        where: {
          id,
        },

        relations: {
          user: true,
        },
      });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor not found',
      );
    }

    return doctor;
  }

  // =====================================================
  // CREATE DOCTOR
  // =====================================================

  async createDoctor(
    email: string,
    password: string,
    specialization?: string,
    qualifications?: string,
    phone?: string,
  ): Promise<Doctor> {
    const existingUser =
      await this.userRepository.findOne({
        where: {
          email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10,
      );

    const user =
      this.userRepository.create({
        email,
        password: hashedPassword,
        role: UserRole.DOCTOR,
        isActive: true,
      });

    const savedUser =
      await this.userRepository.save(user);

    const doctor =
      this.doctorRepository.create({
        user: savedUser,
        specialization,
        qualifications,
        phone,
        isActive: true,
      });

    return this.doctorRepository.save(
      doctor,
    );
  }

  // =====================================================
  // UPDATE DOCTOR
  // =====================================================

  async updateDoctor(
    id: number,
    specialization?: string,
    qualifications?: string,
    phone?: string,
  ): Promise<Doctor> {
    const doctor =
      await this.findById(id);

    if (
      specialization !== undefined
    ) {
      doctor.specialization =
        specialization;
    }

    if (
      qualifications !== undefined
    ) {
      doctor.qualifications =
        qualifications;
    }

    if (phone !== undefined) {
      doctor.phone = phone;
    }

    return this.doctorRepository.save(
      doctor,
    );
  }

  // =====================================================
  // ACTIVATE / DEACTIVATE DOCTOR
  // =====================================================

  async setActive(
    id: number,
    isActive: boolean,
  ): Promise<Doctor> {
    const doctor =
      await this.findById(id);

    doctor.isActive =
      isActive;

    doctor.user.isActive =
      isActive;

    await this.userRepository.save(
      doctor.user,
    );

    return this.doctorRepository.save(
      doctor,
    );
  }

  // =====================================================
  // DELETE DOCTOR
  // =====================================================

  async deleteDoctor(
    id: number,
  ): Promise<{
    message: string;
  }> {
    const doctor =
      await this.findById(id);

    await this.doctorRepository.delete(
      id,
    );

    await this.userRepository.delete(
      doctor.user.id,
    );

    return {
      message:
        'Doctor deleted successfully',
    };
  }
}

