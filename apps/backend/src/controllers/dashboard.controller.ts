import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}