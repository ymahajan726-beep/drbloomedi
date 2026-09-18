import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from '../services/appointments.service';
import { AppointmentStatus } from '../entities/appointment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('doctorId') doctorId?: string,
    @Req() req?: any,
  ) {
  
    let targetDoctorId = doctorId;
    
    if (!targetDoctorId && req?.user) {
      if (req.user.doctorId) {
        targetDoctorId = req.user.doctorId;
      } else if (req.user.role === 'doctor' && req.user.id) {
        // Fallback agar user object me doctor relation id ho
        targetDoctorId = req.user.id;
      }
    }

    return this.appointmentsService.findAll(search, status, targetDoctorId);
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