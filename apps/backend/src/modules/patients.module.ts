import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { PatientsController } from '../controllers/patients.controller';
import { PatientsService } from '../services/patients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, User])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}