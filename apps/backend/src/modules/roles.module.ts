import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { RolesController } from '../controllers/roles.controller';
import { RolesService } from '../services/roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}