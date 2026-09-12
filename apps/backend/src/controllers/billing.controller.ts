import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';

import { BillingService } from '../services/billing.service';
import { PaymentStatus, PaymentMethod } from '../entities/billing.entity';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // 1. Get All Bills (List with filters)
  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.billingService.findAll(search, status);
  }

  // 2. CONSOLIDATED DISCHARGE BILL (Must be above ':id')
  @Get('consolidated/:patientId')
  async getConsolidatedBill(@Param('patientId') patientId: string) {
    return this.billingService.getConsolidatedBill(patientId);
  }

  // 3. Settle Discharge Bill (Discharge & Pay)
  @Post('consolidated/:patientId/settle')
  async settleDischargeBill(
    @Param('patientId') patientId: string,
    @Body('paymentMethod') paymentMethod?: PaymentMethod,
    @Body('appointmentId') appointmentId?: string,
  ) {
    return this.billingService.settleDischargeBill(
      patientId,
      paymentMethod,
      appointmentId,
    );
  }

  // 4. Single Bill Details by ID
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  // 5. Create Manual Bill
  @Post()
  async create(@Body() body: any) {
    return this.billingService.create(body);
  }

  // 6. Update Status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
  ) {
    return this.billingService.updateStatus(id, status);
  }

  // 7. Delete Bill
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.billingService.delete(id);
  }
}