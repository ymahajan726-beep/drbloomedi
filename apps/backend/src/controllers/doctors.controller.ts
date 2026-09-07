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
  ParseIntPipe,
} from '@nestjs/common';
import { DoctorsService } from '../services/doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  async getAll(@Query('search') search?: string) {
    return this.doctorsService.findAll(search);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.doctorsService.create(body);
  }

  // PUT method for updating doctor details
  @Put(':id')
  async updateDoctorPut(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.doctorsService.update(id, body);
  }

  // PATCH method for updating doctor details (fallback)
  @Patch(':id')
  async updateDoctorPatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.doctorsService.update(id, body);
  }

  @Patch(':id/toggle')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.toggleStatus(id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.delete(id);
  }
}