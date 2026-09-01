import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  async getAdminDashboard() {
    const stats =
      await this.usersService.getDashboardStats();

    return {
      totalDoctors: stats.totalDoctors,
      totalPatients: stats.totalPatients,
      totalReception: stats.totalReception,
    };
  }
}