import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medicine } from '../entities/medicine.entity';
import { PharmacyService } from '../services/pharmacy.service';
import { PharmacyController } from '../controllers/pharmacy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Medicine])],
  providers: [PharmacyService],
  controllers: [PharmacyController],
  exports: [PharmacyService],
})
export class PharmacyModule {}