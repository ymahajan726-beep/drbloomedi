import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PrescriptionsService } from '../services/prescriptions.service';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  async create(@Body() body: any) {
    return this.prescriptionsService.create(body);
  }

  @Get('patient/:patientId')
  async getByPatient(@Param('patientId') patientId: string) {
    return this.prescriptionsService.findByPatient(patientId);
  }
}