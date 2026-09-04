import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(search?: string, role?: string): Promise<User[]> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC');

    if (role && Object.values(UserRole).includes(role as UserRole)) {
      qb.andWhere('user.role = :role', { role });
    }

    if (search) {
      qb.andWhere('user.email ILIKE :search', { search: `%${search}%` });
    }

    return qb.getMany();
  }

  async updateRole(userId: string, newRole: UserRole): Promise<User> {
    if (!Object.values(UserRole).includes(newRole)) {
      throw new BadRequestException('Invalid user role specified');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User account not found');

    user.role = newRole;
    return this.userRepo.save(user);
  }

  async toggleActive(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User account not found');

    user.isActive = !user.isActive;
    return this.userRepo.save(user);
  }

  async getRoleMatrix() {
    return [
      {
        role: UserRole.ADMIN,
        description: 'Complete system access, user role assignment & audit logs',
        permissions: ['Full Access', 'Financial Audits', 'User Deletion', 'Staff Onboarding'],
      },
      {
        role: UserRole.DOCTOR,
        description: 'Clinical access, consultations, prescription records & diagnosis',
        permissions: ['OPD Queue', 'Patient History', 'Diagnosis Entry', 'E-Prescriptions'],
      },
      {
        role: UserRole.RECEPTION,
        description: 'Front-desk operations, appointments booking & patient registration',
        permissions: ['Book Appointments', 'Register Patient', 'Generate Invoices', 'Counter Billing'],
      },
      {
        role: UserRole.PATIENT,
        description: 'Self-service portal access for reports and appointment status',
        permissions: ['View Prescriptions', 'Appointment History', 'Download Receipts'],
      },
    ];
  }
}