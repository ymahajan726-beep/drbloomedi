import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from '../services/doctors.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('doctors')
@UseGuards(JwtAuthGuard) 
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('profile/me')
  async getMyProfile(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User session not found');
    }
    
    
    const doctor = await this.doctorsService.findByUserId(userId);
    if (!doctor) {
      throw new UnauthorizedException('Doctor profile not linked with this user account');
    }
    return doctor;
  }

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

  @Put(':id')
  async updateDoctorPut(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.doctorsService.update(id, body);
  }

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