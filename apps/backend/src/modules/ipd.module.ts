import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bed } from '../entities/bed.entity';
import { IpdAdmission } from '../entities/ipd-admission.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { IpdService } from '../services/ipd.service';
import { IpdController } from '../controllers/ipd.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bed, IpdAdmission, Patient, Doctor])],
  providers: [IpdService],
  controllers: [IpdController],
  exports: [IpdService],
})
export class IpdModule {}