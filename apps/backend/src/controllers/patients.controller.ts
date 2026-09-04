import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PatientsService } from '../services/patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async getAll(@Query('search') search?: string) {
    return this.patientsService.findAll(search);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.patientsService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.patientsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.patientsService.delete(id);
  }
}