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
import { PaymentStatus } from '../entities/billing.entity';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.billingService.findAll(search, status);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.billingService.create(body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
  ) {
    return this.billingService.updateStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.billingService.delete(id);
  }
}