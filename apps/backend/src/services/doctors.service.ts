import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Doctor } from '../entities/doctor.entity';
import { User, UserRole } from '../entities/user.entity';
import { Department } from '../entities/department.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async findAll(search?: string): Promise<Doctor[]> {
    const query = this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.department', 'department')
      .orderBy('doctor.createdAt', 'DESC');

    if (search) {
      query.where(
        'doctor.specialization ILIKE :search OR doctor.phone ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Doctor> {
    const doc = await this.doctorRepo.findOne({
      where: { id },
      relations: { user: true, department: true },
    });
    if (!doc) throw new NotFoundException('Doctor not found');
    return doc;
  }

  async create(data: {
    email: string;
    password?: string;
    specialization: string;
    qualifications: string;
    phone: string;
    departmentId?: string;
  }): Promise<Doctor> {
    const normalizedEmail = data.email.trim().toLowerCase();

    let user = await this.userRepo.findOne({ where: { email: normalizedEmail } });
    if (user) {
      const existingDoc = await this.doctorRepo.findOne({
        where: { user: { id: user.id } },
      });
      if (existingDoc) {
        throw new ConflictException('A doctor with this email already exists');
      }
    } else {
      const hashedPassword = await bcrypt.hash(data.password || 'Doctor@123', 10);
      user = this.userRepo.create({
        email: normalizedEmail,
        password: hashedPassword,
        role: UserRole.DOCTOR,
        isActive: true,
      });
      user = await this.userRepo.save(user);
    }

    let department: Department | null = null;
    if (data.departmentId) {
      department = await this.deptRepo.findOne({ where: { id: data.departmentId } });
    }

    const doctor = this.doctorRepo.create({
      user,
      specialization: data.specialization,
      qualifications: data.qualifications,
      phone: data.phone,
      department: department || undefined,
      isActive: true,
    });

    return this.doctorRepo.save(doctor);
  }

  async toggleStatus(id: number): Promise<Doctor> {
    const doc = await this.findOne(id);
    doc.isActive = !doc.isActive;
    return this.doctorRepo.save(doc);
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const doc = await this.findOne(id);
    const userId = doc.user?.id;

    await this.doctorRepo.delete(id);
    if (userId) {
      await this.userRepo.delete(userId).catch(() => null);
    }

    return { success: true, message: 'Doctor profile removed successfully' };
  }
}