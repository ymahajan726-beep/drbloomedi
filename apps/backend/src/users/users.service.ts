import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role ?? UserRole.USER,
    });

    return this.userRepository.save(user);
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}