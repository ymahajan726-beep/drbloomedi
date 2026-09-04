import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from '../entities/doctor.entity';
import { User } from '../entities/user.entity';
import { Department } from '../entities/department.entity';
import { DoctorsController } from '../controllers/doctors.controller';
import { DoctorsService } from '../services/doctors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, User, Department])],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}