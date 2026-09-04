import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { DepartmentsService } from '../services/departments.service';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly deptService: DepartmentsService) {}

  @Get()
  async getAll() {
    return this.deptService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.deptService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.deptService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.deptService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.deptService.delete(id);
  }
}