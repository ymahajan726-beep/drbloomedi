import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Billing } from '../entities/billing.entity';
import { Appointment } from '../entities/appointment.entity';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Billing, Appointment])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}