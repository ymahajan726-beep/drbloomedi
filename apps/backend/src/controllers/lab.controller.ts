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

  // 3. Get all lab orders (Queue for Lab Technician - Sorted Old to New)
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

  // 5. Doctor consultation se multiple lab orders create karne aur billing update karne ka route
  @Post('consultation-orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrdersFromConsultation(
    @Body()
    data: {
      appointmentId: string;
      patientId: string;
      labTestIds: string[];
    },
  ) {
    return this.labService.createOrdersFromConsultation(data);
  }

  // 6. Update Sample Collection Status
  @Patch('orders/:id/sample-status')
  async updateSampleStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.labService.updateSampleStatus(id, status);
  }

  // 7. Report Generation & Submit Observed Values (PDF Upload support)
  @Post('orders/:id/report')
  @HttpCode(HttpStatus.OK)
  async submitReport(
    @Param('id') id: string,
    @Body() body: { observedValue: string; remarks?: string; reportFileUrl?: string },
  ) {
    return this.labService.submitReport(id, body);
  }

  // 8. Get single order detail (For Report View & Online Access)
  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return this.labService.getOrderById(id);
  }
}