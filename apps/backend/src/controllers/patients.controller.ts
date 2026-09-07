import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PatientsService } from '../services/patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async getAll(@Query('search') search?: string) {
    return this.patientsService.findAll(search);
  }

  // Specific route ':id' se pehle aana chahiye
  @Get('search')
  async search(@Query('q') query?: string, @Query('search') search?: string) {
    return this.patientsService.findAll(query || search);
  }

  // ParseUUIDPipe invalid string jaise "search" ko database query banne se rokega
  @Get(':id')
  async getOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.patientsService.create(body);
  }

  @Put(':id')
  async updatePut(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: any,
  ) {
    return this.patientsService.update(id, body);
  }

  @Patch(':id')
  async updatePatch(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: any,
  ) {
    return this.patientsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.patientsService.delete(id);
  }
}