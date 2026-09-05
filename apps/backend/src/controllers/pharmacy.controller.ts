import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PharmacyService } from '../services/pharmacy.service';

@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.pharmacyService.findAll(search, category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pharmacyService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.pharmacyService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.pharmacyService.update(id, body);
  }

  @Patch(':id/dispense')
  dispense(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.pharmacyService.dispense(id, quantity);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.pharmacyService.delete(id);
  }
}