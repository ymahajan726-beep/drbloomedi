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
  // FIND ALL USERS
  // =====================================================

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: {
        createdAt: 'DESC',
      },
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
      });

    return this.userRepository.save(user);
  }

  // =====================================================
  // CREATE USER
  // =====================================================

  async createUser(
    email: string,
    password: string,
    role: UserRole = UserRole.PATIENT,
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

    const user =
      this.userRepository.create({
        email,
        password: hashedPassword,
        role,
        isActive: true,
      });

    return this.userRepository.save(user);
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

    /*
     * Check whether reset token exists
     * and is still valid.
     */
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