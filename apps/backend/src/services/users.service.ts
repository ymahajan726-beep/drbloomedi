import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Doctor } from '../entities/doctor.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: String(id) },
    });
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => {
      if (!user.name || user.name === 'Staff User') {
        user.name = user.email ? user.email.split('@')[0] : 'User';
      }
      return user;
    });
  }

  async createAdmin(email: string, password: string): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) return existing;

    const user = this.userRepository.create({
      email,
      password: await bcrypt.hash(password, 10),
      role: UserRole.ADMIN,
      isActive: true,
    } as any);

    const saved = await this.userRepository.save(user as any);
    return Array.isArray(saved) ? saved[0] : (saved as User);
  }

  async createUser(
    email: string,
    password: string,
    role: UserRole = UserRole.PATIENT,
    name?: string,
    phone?: string,
  ): Promise<User> {
    const existing = await this.findByEmail(email);

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedName = name || email.split('@')[0];

    try {
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        role,
        name: resolvedName,
        phone: phone || null,
        isActive: true,
      } as any);

      const saved = await this.userRepository.save(user as any);
      return Array.isArray(saved) ? saved[0] : (saved as User);
    } catch {
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        role,
        name: resolvedName,
        isActive: true,
      } as any);

      const saved = await this.userRepository.save(user as any);
      return Array.isArray(saved) ? saved[0] : (saved as User);
    }
  }

  async updateUser(id: string, updateData: any): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((user as any).isSystem && updateData.role && updateData.role !== UserRole.ADMIN) {
      throw new ForbiddenException('System Admin Role cannot be modified.');
    }

    if (updateData.password && updateData.password.trim() !== '') {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);

    if (user.role === UserRole.DOCTOR && updateData.specialization) {
      const doctorProfile = await this.doctorRepository.findOne({
        where: { user: { id: user.id } },
      });
      if (doctorProfile) {
        doctorProfile.specialization = updateData.specialization;
        if (updateData.phone) doctorProfile.phone = updateData.phone;
        await this.doctorRepository.save(doctorProfile);
      }
    }

    return updatedUser;
  }

  async setActive(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((user as any).isSystem && isActive === false) {
      throw new ForbiddenException('System Administrator cannot be deactivated.');
    }

    user.isActive = isActive;
    const savedUser = await this.userRepository.save(user);

    if (user.role === UserRole.DOCTOR) {
      const doctorProfile = await this.doctorRepository.findOne({
        where: { user: { id: user.id } },
      });
      if (doctorProfile) {
        doctorProfile.isActive = isActive;
        await this.doctorRepository.save(doctorProfile);
      }
    }

    return savedUser;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((user as any).isSystem) {
      throw new ForbiddenException('System Administrator cannot be deleted.');
    }

    if (user.role === UserRole.DOCTOR) {
      await this.doctorRepository.delete({ user: { id: user.id } } as any);
    }

    await this.userRepository.delete(String(id));

    return { message: 'User deleted successfully' };
  }

  async saveResetToken(
    user: User,
    token: string,
    expiresAt: Date,
  ): Promise<User> {
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiresAt;

    return this.userRepository.save(user);
  }

  async findByResetToken(token: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      return null;
    }

    return user;
  }

  async updatePassword(
    user: User,
    newPassword: string,
  ): Promise<User> {
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    return this.userRepository.save(user);
  }

  async getDashboardStats(): Promise<{
    totalDoctors: number;
    totalPatients: number;
    totalReception: number;
  }> {
    const [totalDoctors, totalPatients, totalReception] =
      await Promise.all([
        this.userRepository.count({
          where: { role: UserRole.DOCTOR, isActive: true },
        }),
        this.userRepository.count({
          where: { role: UserRole.PATIENT, isActive: true },
        }),
        this.userRepository.count({
          where: { role: UserRole.RECEPTION, isActive: true },
        }),
      ]);

    return {
      totalDoctors,
      totalPatients,
      totalReception,
    };
  }
}