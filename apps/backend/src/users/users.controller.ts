import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserRole } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async createUser(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
    },
  ) {
    const hashedPassword = await bcrypt.hash(body.password, 10);

    return this.usersService.createUser({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role ?? UserRole.USER,
    });
  }
}