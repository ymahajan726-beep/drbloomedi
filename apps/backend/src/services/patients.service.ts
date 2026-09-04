import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Patient } from '../entities/patient.entity';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(search?: string): Promise<Patient[]> {
    const qb = this.patientRepo
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .orderBy('patient.createdAt', 'DESC');

    if (search) {
      qb.where(
        'patient.fullName ILIKE :search OR patient.email ILIKE :search OR patient.phone ILIKE :search OR patient.bloodGroup ILIKE :search',
        { search: `%${search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!patient) throw new NotFoundException('Patient record not found');
    return patient;
  }

  async create(data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    age: number;
    gender: string;
    bloodGroup: string;
    address?: string;
    emergencyContact?: string;
    medicalHistory?: string;
    patientType?: string;
  }): Promise<Patient> {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await this.patientRepo.findOne({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException('Patient with this email already registered');
    }

    let user = await this.userRepo.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(data.password || 'Patient@123', 10);
      user = this.userRepo.create({
        email: normalizedEmail,
        password: hashedPassword,
        role: UserRole.PATIENT,
        isActive: true,
      });
      user = await this.userRepo.save(user);
    }

    const patient = this.patientRepo.create({
      fullName: data.fullName,
      email: normalizedEmail,
      phone: data.phone,
      age: Number(data.age),
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      address: data.address,
      emergencyContact: data.emergencyContact,
      medicalHistory: data.medicalHistory,
      patientType: data.patientType || 'Outpatient',
      user,
    });

    return this.patientRepo.save(patient);
  }

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    const patient = await this.findOne(id);
    Object.assign(patient, data);
    return this.patientRepo.save(patient);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const patient = await this.findOne(id);
    const userId = patient.user?.id;

    await this.patientRepo.delete(id);
    if (userId) {
      await this.userRepo.delete(userId).catch(() => null);
    }

    return { success: true, message: 'Patient removed successfully' };
  }
}