import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PharmacyService } from '../services/pharmacy.service';

@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // 1. Get Live Inventory with Stock & Expiry Flags
  @Get('inventory')
  async getInventory(@Query('search') search?: string) {
    return this.pharmacyService.getInventory(search);
  }

  // 2. Add New Medicine / Stock Batch
  @Post('inventory')
  @HttpCode(HttpStatus.CREATED)
  async addMedicine(@Body() body: any) {
    return this.pharmacyService.addMedicine(body);
  }

  // 3. Hospital Pharmacy Audits: Low Stock & Expiry Alerts
  @Get('alerts')
  async getAlerts() {
    return this.pharmacyService.getPharmacyAlerts();
  }

  // 4. Sales Dispense & Auto GST Billing Engine
  @Post('dispense-bill')
  @HttpCode(HttpStatus.OK)
  async processSaleAndBill(
    @Body()
    body: {
      patientId: string;
      items: Array<{ medicineId: string; quantity: number }>;
      paymentMethod?: string;
    },
  ) {
    return this.pharmacyService.processSaleAndBill(body);
  }
}