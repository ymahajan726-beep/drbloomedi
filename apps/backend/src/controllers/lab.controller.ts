import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { LabService } from '../services/lab.service';
import { LabOrderStatus } from '../entities/lab-order.entity';

@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  // Test Master Catalog
  @Get('tests')
  getAllTests(@Query('category') category?: string) {
    return this.labService.getAllTests(category);
  }

  @Post('tests')
  createTest(@Body() body: any) {
    return this.labService.createTest(body);
  }

  // Patient Lab Orders
  @Get('orders')
  getAllOrders(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.labService.getAllOrders(search, status);
  }

  @Get('orders/:id')
  getOneOrder(@Param('id') id: string) {
    return this.labService.findOneOrder(id);
  }

  @Post('orders')
  createOrder(
    @Body() body: { patientId: string; doctorId?: number; labTestId: string },
  ) {
    return this.labService.createOrder(body);
  }

  @Patch('orders/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: LabOrderStatus,
  ) {
    return this.labService.updateOrderStatus(id, status);
  }

  @Patch('orders/:id/result')
  recordResult(
    @Param('id') id: string,
    @Body()
    body: {
      resultValue: string;
      reportFileUrl?: string;
      technicianRemarks?: string;
      isAbnormal?: boolean;
    },
  ) {
    return this.labService.recordResult(
      id,
      body.resultValue,
      body.technicianRemarks,
      body.isAbnormal,
      body.reportFileUrl,
    );
  }
}