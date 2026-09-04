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
import { AppointmentsService } from '../services/appointments.service';
import { AppointmentStatus } from '../entities/appointment.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.appointmentsService.findAll(search, status);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.appointmentsService.create(body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.appointmentsService.delete(id);
  }
}