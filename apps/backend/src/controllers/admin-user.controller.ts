import { Controller, Post, Body, Get, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Controller('admin/users')
export class AdminUserController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // 1. सभी मौजूदा स्टाफ यूज़र्स की लिस्ट
  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.userRepo.find({
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  // 2. एडमिन द्वारा नया यूज़र, पासवर्ड और परमिशन बनाना
  @Post('create')
  async createUser(
    @Body()
    body: {
      email: string;
      password: string;
      role: UserRole;
      permissions: string[];
    },
  ) {
    if (!body.email?.trim() || !body.password?.trim()) {
      throw new BadRequestException('Email and password are required');
    }

    const email = body.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.password.trim(), saltRounds);

    const newUser = new User();
    newUser.email = email;
    newUser.password = hashedPassword; // आपकी entity में 'password' नाम है
    newUser.role = body.role || UserRole.RECEPTION;
    newUser.permissions = body.permissions || [];

    const saved: User = await this.userRepo.save(newUser);

    return {
      message: 'User created successfully',
      user: {
        id: saved.id,
        email: saved.email,
        role: saved.role,
        permissions: saved.permissions,
      },
    };
  }
}