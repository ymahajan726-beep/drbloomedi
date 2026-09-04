import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  async getAdminStats() {
    return this.dashboardService.getAdminStats();
  }
}