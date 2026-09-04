import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receptionist } from '../entities/receptionist.entity';
import { User } from '../entities/user.entity';
import { ReceptionController } from '../controllers/reception.controller';
import { ReceptionService } from '../services/reception.service';

@Module({
  imports: [TypeOrmModule.forFeature([Receptionist, User])],
  controllers: [ReceptionController],
  providers: [ReceptionService],
  exports: [ReceptionService],
})
export class ReceptionModule {}