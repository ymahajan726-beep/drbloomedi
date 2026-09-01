
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { DoctorService } from '../services/doctors.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
  ) {}

  // =====================================================
  // GET ALL DOCTORS
  // GET /doctors
  // =====================================================

  @Get()
  async findAll() {
    return this.doctorService.findAll();
  }

  // =====================================================
  // GET DOCTOR BY ID
  // GET /doctors/:id
  // =====================================================

  @Get(':id')
  async findById(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.doctorService.findById(id);
  }

  // =====================================================
  // CREATE DOCTOR
  // POST /doctors
  // =====================================================

  @Post()
  async createDoctor(
    @Body()
    body: {
      email: string;
      password: string;
      specialization?: string;
      qualifications?: string;
      phone?: string;
    },
  ) {
    return this.doctorService.createDoctor(
      body.email,
      body.password,
      body.specialization,
      body.qualifications,
      body.phone,
    );
  }

  // =====================================================
  // UPDATE DOCTOR
  // PATCH /doctors/:id
  // =====================================================

  @Patch(':id')
  async updateDoctor(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: {
      specialization?: string;
      qualifications?: string;
      phone?: string;
    },
  ) {
    return this.doctorService.updateDoctor(
      id,
      body.specialization,
      body.qualifications,
      body.phone,
    );
  }

  // =====================================================
  // ACTIVATE / DEACTIVATE DOCTOR
  // PATCH /doctors/:id/status
  // =====================================================

  @Patch(':id/status')
  async setActive(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: {
      isActive: boolean;
    },
  ) {
    return this.doctorService.setActive(
      id,
      body.isActive,
    );
  }

  // =====================================================
  // DELETE DOCTOR
  // DELETE /doctors/:id
  // =====================================================

  @Delete(':id')
  async deleteDoctor(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.doctorService.deleteDoctor(id);
  }
}

