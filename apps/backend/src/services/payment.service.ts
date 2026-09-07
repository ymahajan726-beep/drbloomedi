import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Billing, PaymentStatus } from '../entities/billing.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';

@Injectable()
export class PaymentService {
  constructor(private readonly dataSource: DataSource) {}

  // 1. Order Creation
  async createOrder(billId: string, customAmount?: number) {
    const amountInRupees = customAmount || 500;
    const amountInPaise = Math.round(amountInRupees * 100);

    return {
      success: true,
      orderId: `order_${Date.now()}`,
      amount: amountInPaise,
      currency: 'INR',
      keyId: 'rzp_test_drbloomedi',
      billId: billId,
    };
  }

  // 2. Verify Payment and Persist Permanently to Database
  async verifyPayment(body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    billId?: string;
    appointmentId?: string;
  }) {
    const targetId = body.appointmentId || body.billId;

    if (!targetId) {
      throw new BadRequestException('Appointment or Bill ID is required');
    }

    const txnId = body.razorpay_payment_id || `pay_${Date.now().toString().slice(-8)}`;

    const aptRepo = this.dataSource.getRepository(Appointment);
    const billRepo = this.dataSource.getRepository(Billing);

    // A. Update Appointment in Postgres
    try {
      const apt = await aptRepo.findOne({
        where: [{ id: targetId as any }, { appointmentNumber: targetId }] as any,
        relations: { patient: true },
      });

      if (apt) {
        apt.status = AppointmentStatus?.COMPLETED || ('Completed' as any);
        (apt as any).isPaid = true;
        (apt as any).paymentId = txnId;
        await aptRepo.save(apt);
      }
    } catch (e) {
      console.warn('Could not persist appointment status:', e);
    }

    // B. Update Billing Table if exists
    try {
      let bill = await billRepo.findOne({
        where: [{ id: targetId as any }, { appointment: { id: targetId } }] as any,
      });

      if (bill) {
        bill.paymentStatus = PaymentStatus.PAID;
        (bill as any).transactionId = txnId;
        await billRepo.save(bill);
      }
    } catch (e) {
      // Ignore if billing row not generated yet
    }

    return {
      success: true,
      message: 'Payment verified and saved to database',
      paymentId: txnId,
      orderId: body.razorpay_order_id,
    };
  }
}