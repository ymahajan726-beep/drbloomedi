import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PrescriptionsService } from '../services/prescriptions.service';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly rxService: PrescriptionsService) {}

  @Post()
  create(@Body() body: any) {
    return this.rxService.create(body);
  }

  @Get('appointment/:id')
  findByAppointment(@Param('id') id: string) {
    return this.rxService.findByAppointment(id);
  }

  @Get('patient/:id')
  findByPatient(@Param('id') id: string) {
    return this.rxService.findByPatient(id);
  }
}