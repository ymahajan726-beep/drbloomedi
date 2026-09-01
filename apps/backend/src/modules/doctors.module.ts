
import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Doctor } from '../entities/doctor.entity';

import { User } from '../entities/user.entity';

import { DoctorController } from '../controllers/doctors.controller';

import { DoctorService } from '../services/doctors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      User,
    ]),
  ],

  controllers: [
    DoctorController,
  ],

  providers: [
    DoctorService,
  ],

  exports: [
    DoctorService,
  ],
})
export class DoctorModule {}

