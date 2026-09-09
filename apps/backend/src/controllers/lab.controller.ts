import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { LabService } from '../services/lab.service';

@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Get('tests')
  async getAllTests() {
    return this.labService.getAllTests();
  }

  @Post('tests')
  async createTest(
    @Body()
    data: {
      testName: string;
      price: number;
      normalRange?: string;
      unit?: string;
      description?: string;
    },
  ) {
    return this.labService.createTest(data);
  }

  @Get('orders')
  async getAllOrders() {
    return this.labService.getAllOrders();
  }

  @Post('orders')
  async bookTest(
    @Body() body: { patientId: string; labTestId: string; notes?: string },
  ) {
    return this.labService.bookTest(body);
  }

  @Post('consultation-orders')
  async createConsultationOrders(
    @Body()
    data: {
      appointmentId: string;
      patientId: string;
      labTestIds: string[];
    },
  ) {
    return this.labService.createOrdersFromConsultation(data);
  }

  @Patch('orders/:id/sample-status')
  async updateSampleStatus(
    @Param('id') orderId: string,
    @Body('status') status: string,
  ) {
    return this.labService.updateSampleStatus(orderId, status);
  }

  @Post('orders/:id/report')
  async submitReport(
    @Param('id') orderId: string,
    @Body()
    reportData: {
      observedValue: string;
      remarks?: string;
      reportFileUrl?: string;
    },
  ) {
    return this.labService.submitReport(orderId, reportData);
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') orderId: string) {
    return this.labService.getOrderById(orderId);
  }
}