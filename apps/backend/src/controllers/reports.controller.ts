import { Controller, Get } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary() {
    return this.reportsService.getExecutiveReport();
  }
}