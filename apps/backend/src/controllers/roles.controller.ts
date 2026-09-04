import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { UserRole } from '../entities/user.entity';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.rolesService.findAll(search, role);
  }

  @Get('matrix')
  async getMatrix() {
    return this.rolesService.getRoleMatrix();
  }

  @Patch('users/:id/role')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.rolesService.updateRole(id, role);
  }

  @Patch('users/:id/toggle')
  async toggleActive(@Param('id') id: string) {
    return this.rolesService.toggleActive(id);
  }
}