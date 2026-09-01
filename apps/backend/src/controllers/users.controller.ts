import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { UsersService } from '../services/users.service';
import { UserRole } from '../entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // GET /users
  @Get()
  async findAll() {
    const users =
      await this.usersService.findAll();

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  // GET /users/:id
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    const user =
      await this.usersService.findById(id);

    if (!user) {
      return {
        message: 'User not found',
      };
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // POST /users
  @Post()
  async create(
    @Body()
    body: {
      email: string;
      password: string;
      role?: UserRole;
    },
  ) {
    const user =
      await this.usersService.createUser(
        body.email,
        body.password,
        body.role ?? UserRole.PATIENT,
      );

    return {
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  // PATCH /users/:id/active
  @Patch(':id/active')
  async updateStatus(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    body: {
      isActive: boolean;
    },
  ) {
    const user =
      await this.usersService.setActive(
        id,
        body.isActive,
      );

    return {
      message: 'User status updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  // DELETE /users/:id
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.usersService.deleteUser(id);
  }
}