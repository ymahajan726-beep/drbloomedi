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
import { ReceptionService } from '../services/reception.service';

@Controller('reception')
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

  @Get()
  async getAll(@Query('search') search?: string) {
    return this.receptionService.findAll(search);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.receptionService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.receptionService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.receptionService.update(id, body);
  }

  @Patch(':id/toggle')
  async toggleStatus(@Param('id') id: string) {
    return this.receptionService.toggleStatus(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.receptionService.delete(id);
  }
}