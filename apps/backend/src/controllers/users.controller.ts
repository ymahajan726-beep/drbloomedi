import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UserRole } from '../entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // =====================================================
  // GET ALL USERS
  // =====================================================
  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }

  // =====================================================
  // GET DASHBOARD STATS
  // =====================================================
  @Get('stats')
  async getStats() {
    return this.usersService.getDashboardStats();
  }

  // =====================================================
  // GET USER BY ID
  // =====================================================
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // =====================================================
  // CREATE USER (ADMIN / RECEPTION / PATIENT / DOCTOR)
  // =====================================================
  @Post()
  async createUser(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role?: UserRole,
    @Body('name') name?: string,
    @Body('fullName') fullName?: string,
    @Body('phone') phone?: string,
  ) {
    // Agar service me extra fields support karni hai toh pass karein ya default createUser use karein
    return this.usersService.createUser(email, password, role);
  }

  // =====================================================
  // TOGGLE ACTIVE STATUS (Updated to support both /active and /status)
  // =====================================================
  @Patch(':id/active')
  async toggleActiveStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.setActive(id, isActive);
  }

  @Patch(':id/status')
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.setActive(id, isActive);
  }

  // =====================================================
  // DELETE USER
  // =====================================================
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}