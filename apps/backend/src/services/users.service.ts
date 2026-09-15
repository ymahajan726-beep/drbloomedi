import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  User,
  UserRole,
} from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // =====================================================
  // FIND USER BY EMAIL
  // =====================================================

  async findByEmail(
    email: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  // =====================================================
  // FIND USER BY ID (UUID - string)
  // =====================================================

  async findById(
    id: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        id: String(id),
      },
    });
  }

  // =====================================================
  // FIND ALL USERS (With Name & Phone Fallback)
  // =====================================================

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => {
      // Name fallback
      if (!user.name || user.name === 'Staff User') {
        user.name = user.email ? user.email.split('@')[0] : 'User';
      }

      // Phone fallback: extract from permissions if physical column is missing
      if (!user.phone && user.permissions && Array.isArray(user.permissions)) {
        const phonePerm = user.permissions.find((p) => p.startsWith('PHONE:'));
        if (phonePerm) {
          user.phone = phonePerm.replace('PHONE:', '');
        }
      }

      return user;
    });
  }

  // =====================================================
  // CREATE ADMIN
  // =====================================================

  async createAdmin(
    email: string,
    password: string,
  ): Promise<User> {
    const existingUser =
      await this.findByEmail(email);

    if (existingUser) {
      return existingUser;
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
        role: UserRole.ADMIN,
        isActive: true,
      } as any);

    const saved = await this.userRepository.save(user as any);
    return Array.isArray(saved) ? saved[0] : (saved as User);
  }

  // =====================================================
  // CREATE USER (Supports Name and Phone with Safe Fallback)
  // =====================================================

  async createUser(
    email: string,
    password: string,
    role: UserRole = UserRole.PATIENT,
    name?: string,
    phone?: string,
  ): Promise<User> {
    const existingUser =
      await this.findByEmail(email);

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

    const resolvedName = name || email.split('@')[0];
    const permissionsList = phone ? [`PHONE:${phone}`] : [];

    try {
      // Try saving with standard phone column
      const user =
        this.userRepository.create({
          email,
          password: hashedPassword,
          role,
          name: resolvedName,
          phone: phone || null,
          permissions: permissionsList,
          isActive: true,
        } as any);

      const saved = await this.userRepository.save(user as any);
      return Array.isArray(saved) ? saved[0] : (saved as User);
    } catch (err) {
      // Fallback: save safely inside permissions if phone column is missing in DB
      const user =
        this.userRepository.create({
          email,
          password: hashedPassword,
          role,
          name: resolvedName,
          permissions: permissionsList,
          isActive: true,
        } as any);

      const saved = await this.userRepository.save(user as any);
      return Array.isArray(saved) ? saved[0] : (saved as User);
    }
  }

  // =====================================================
  // SET USER ACTIVE / INACTIVE
  // =====================================================

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<User> {
    const user =
      await this.findById(id);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    user.isActive =
      isActive;

    return this.userRepository.save(
      user,
    );
  }

  // =====================================================
  // DELETE USER
  // =====================================================

  async deleteUser(
    id: string,
  ): Promise<{
    message: string;
  }> {
    const user =
      await this.findById(id);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    await this.userRepository.delete(
      String(id),
    );

    return {
      message:
        'User deleted successfully',
    };
  }

  // =====================================================
  // SAVE PASSWORD RESET TOKEN
  // =====================================================

  async saveResetToken(
    user: User,
    token: string,
    expiresAt: Date,
  ): Promise<User> {
    user.resetPasswordToken =
      token;

    user.resetPasswordExpires =
      expiresAt;

    return this.userRepository.save(
      user,
    );
  }

  // =====================================================
  // FIND USER BY RESET TOKEN
  // =====================================================

  async findByResetToken(
    token: string,
  ): Promise<User | null> {
    const user =
      await this.userRepository.findOne({
        where: {
          resetPasswordToken:
            token,
        },
      });

    if (!user) {
      return null;
    }

    if (
      !user.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() <
        Date.now()
    ) {
      return null;
    }

    return user;
  }

  // =====================================================
  // UPDATE PASSWORD
  // =====================================================

  async updatePassword(
    user: User,
    newPassword: string,
  ): Promise<User> {
    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10,
      );

    user.password =
      hashedPassword;

    user.resetPasswordToken =
      null;

    user.resetPasswordExpires =
      null;

    return this.userRepository.save(
      user,
    );
  }

  // =====================================================
  // ADMIN DASHBOARD COUNTS
  // =====================================================

  async getDashboardStats(): Promise<{
    totalDoctors: number;
    totalPatients: number;
    totalReception: number;
  }> {
    const totalDoctors =
      await this.userRepository.count({
        where: {
          role: UserRole.DOCTOR,
        },
      });

    const totalPatients =
      await this.userRepository.count({
        where: {
          role: UserRole.PATIENT,
        },
      });

    const totalReception =
      await this.userRepository.count({
        where: {
          role: UserRole.RECEPTION,
        },
      });

    return {
      totalDoctors,
      totalPatients,
      totalReception,
    };
  }
}