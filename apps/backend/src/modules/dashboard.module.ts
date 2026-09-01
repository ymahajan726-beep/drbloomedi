import { Module } from '@nestjs/common';

import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { UsersModule } from './users.module';

@Module({
  imports: [
    UsersModule,
  ],

  controllers: [
    DashboardController,
  ],

  providers: [
    DashboardService,
  ],

  exports: [
    DashboardService,
  ],
})
export class DashboardModule {}