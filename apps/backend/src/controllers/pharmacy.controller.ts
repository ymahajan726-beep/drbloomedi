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

  @Get('inventory')
  async getInventory(@Query('search') search?: string) {
    return this.pharmacyService.getInventory(search);
  }

  @Post('inventory')
  @HttpCode(HttpStatus.CREATED)
  async addMedicine(@Body() body: any) {
    return this.pharmacyService.addMedicine(body);
  }

  @Get('alerts')
  async getAlerts() {
    return this.pharmacyService.getPharmacyAlerts();
  }

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