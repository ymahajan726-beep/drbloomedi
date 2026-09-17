import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Receptionist } from '../entities/receptionist.entity';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class ReceptionService {
  constructor(
    @InjectRepository(Receptionist)
    private readonly receptionRepo: Repository<Receptionist>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(search?: string): Promise<Receptionist[]> {
    const qb = this.receptionRepo
      .createQueryBuilder('receptionist')
      .leftJoinAndSelect('receptionist.user', 'user')
      .orderBy('receptionist.createdAt', 'DESC');

    if (search?.trim()) {
      qb.where(
        'receptionist.fullName ILIKE :search OR receptionist.email ILIKE :search OR receptionist.counterDesk ILIKE :search',
        { search: `%${search.trim()}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Receptionist> {
    const staff = await this.receptionRepo.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!staff) {
      throw new NotFoundException('Receptionist record not found');
    }

    return staff;
  }

  async create(data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    shiftTiming: string;
    counterDesk: string;
  }): Promise<Receptionist> {
    const email = data.email.trim().toLowerCase();

    const existingUser = await this.userRepo.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = await this.userRepo.save(
      this.userRepo.create({
        email,
        password: await bcrypt.hash(data.password || 'Reception@123', 10),
        role: UserRole.RECEPTION,
        isActive: true,
      }),
    );

    return this.receptionRepo.save(
      this.receptionRepo.create({
        fullName: data.fullName,
        email,
        phone: data.phone,
        shiftTiming: data.shiftTiming,
        counterDesk: data.counterDesk,
        isActive: true,
        user,
      }),
    );
  }

  async update(
    id: string,
    data: Partial<Receptionist>,
  ): Promise<Receptionist> {
    const staff = await this.findOne(id);
    Object.assign(staff, data);
    return this.receptionRepo.save(staff);
  }

  async toggleStatus(id: string): Promise<Receptionist> {
    const staff = await this.findOne(id);
    staff.isActive = !staff.isActive;

    if (staff.user) {
      staff.user.isActive = staff.isActive;
      await this.userRepo.save(staff.user);
    }

    return this.receptionRepo.save(staff);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const staff = await this.findOne(id);
    const userId = staff.user?.id;

    await this.receptionRepo.delete(id);

    if (userId) {
      await this.userRepo.delete(userId).catch(() => null);
    }

    return {
      success: true,
      message: 'Receptionist removed successfully',
    };
  }
}
