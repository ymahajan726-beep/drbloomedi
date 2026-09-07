import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LabService } from '../services/lab.service';

@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  // 1. Get all tests from catalog
  @Get('tests')
  async getAllTests() {
    return this.labService.getAllTests();
  }

  // 2. Add new test to catalog
  @Post('tests')
  @HttpCode(HttpStatus.CREATED)
  async createTest(@Body() body: any) {
    return this.labService.createTest(body);
  }

  // 3. Get all lab orders (Queue for Lab Technician)
  @Get('orders')
  async getAllOrders() {
    return this.labService.getAllOrders();
  }

  // 4. Book a new lab test
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async bookTest(@Body() body: { patientId: string; labTestId: string; notes?: string }) {
    return this.labService.bookTest(body);
  }

  // 5. Update Sample Collection Status
  @Patch('orders/:id/sample-status')
  async updateSampleStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.labService.updateSampleStatus(id, status);
  }

  // 6. Report Generation & Submit Observed Values
  @Post('orders/:id/report')
  @HttpCode(HttpStatus.OK)
  async submitReport(
    @Param('id') id: string,
    @Body() body: { observedValue: string; remarks?: string; reportFileUrl?: string },
  ) {
    return this.labService.submitReport(id, body);
  }

  // 7. Get single order detail (For Report View & Online Access)
  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return this.labService.getOrderById(id);
  }
}