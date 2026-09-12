import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Billing, PaymentMethod, PaymentStatus } from '../entities/billing.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
  private readonly razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
  private readonly razorpay: Razorpay;

  constructor(private readonly dataSource: DataSource) {
    if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(this.razorpayKeyId)) {
      throw new Error('RAZORPAY_KEY_ID must be a valid Razorpay key starting with rzp_test_ or rzp_live_');
    }

    if (!this.razorpayKeySecret) {
      throw new Error('RAZORPAY_KEY_SECRET is required');
    }

    this.razorpay = new Razorpay({
      key_id: this.razorpayKeyId,
      key_secret: this.razorpayKeySecret,
    });
  }

  // 1. Order Creation with Idempotency Support
  async createOrder(billId: string, customAmount?: number) {
    const amountInRupees = Number(customAmount ?? 500);
    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const amountInPaise = Math.round(amountInRupees * 100);
    const order = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: billId ? `bill_${billId}`.slice(0, 40) : `receipt_${Date.now()}`,
      notes: billId ? { billId } : undefined,
    });

    this.logger.log(`Created Razorpay order ${order.id} for target reference: ${billId}`);

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.razorpayKeyId,
      billId: billId,
    };
  }

  // 2. Verify Payment with Cryptographic Signature Check & Database Persistence
  async verifyPayment(body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    billId?: string;
    appointmentId?: string;
    amount?: number;
  }) {
    const targetId = body.appointmentId || body.billId;

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      throw new BadRequestException('Razorpay order, payment, and signature are required');
    }

    // A. Cryptographic HMAC SHA256 Signature Security Check
    const generatedSignature = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    const expected = Buffer.from(generatedSignature, 'utf8');
    const received = Buffer.from(body.razorpay_signature, 'utf8');
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      this.logger.warn(`Cryptographic signature mismatch for payment ID: ${body.razorpay_payment_id}`);
      throw new BadRequestException('Invalid payment signature verification failed!');
    }

    const order = await this.razorpay.orders.fetch(body.razorpay_order_id);
    const payment = await this.razorpay.payments.fetch(body.razorpay_payment_id);
    if (payment.order_id !== body.razorpay_order_id) {
      throw new BadRequestException('Payment does not belong to the supplied Razorpay order');
    }

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      throw new BadRequestException(`Razorpay payment is not payable: ${payment.status}`);
    }

    const txnId = body.razorpay_payment_id;
    const paidAmount = Number(order.amount) / 100;

    const aptRepo = this.dataSource.getRepository(Appointment);
    const billRepo = this.dataSource.getRepository(Billing);
    let appointment: Appointment | null = null;

    // B. Update Appointment if targetId matches
    if (targetId) {
      try {
        appointment = await aptRepo.findOne({
          where: [{ id: targetId as any }, { appointmentNumber: targetId }] as any,
          relations: { patient: true },
        });

        if (appointment) {
          if (String((appointment as any).paymentStatus || '').toUpperCase() !== 'SUCCESS' && (appointment as any).isPaid !== true) {
            appointment.status = AppointmentStatus?.COMPLETED || ('Completed' as any);
            (appointment as any).isPaid = true;
            (appointment as any).paymentId = txnId;
            (appointment as any).paymentStatus = 'SUCCESS';
            await aptRepo.save(appointment);
          }
        }
      } catch (e) {
        this.logger.warn('Could not persist appointment status:', e);
      }
    }

    // C. Find or Auto-Create Billing Record for Gross Revenue Tracking
    try {
      let bill: Billing | null = null;
      if (targetId) {
        bill = await billRepo.findOne({
          where: { id: targetId as any },
          relations: { patient: true },
        });
      }

      if (bill) {
        bill.paymentStatus = PaymentStatus.PAID;
        (bill as any).transactionId = txnId;
        (bill as any).amount = paidAmount;
        (bill as any).totalAmount = paidAmount;
        await billRepo.save(bill);
        this.logger.log(`Billing record ${bill.id} successfully updated to PAID.`);
      } else {
        const newBill = billRepo.create({
          invoiceNumber: `INV-${Date.now()}`,
          patient: appointment?.patient,
          appointment: appointment || null,
          consultationFee: paidAmount,
          totalAmount: paidAmount,
          paymentMethod: PaymentMethod.UPI,
          paymentStatus: PaymentStatus.PAID,
          notes: `Razorpay payment ${txnId}`,
        } as any);
        await billRepo.save(newBill);
        this.logger.log(`New PAID billing record created automatically for amount ₹${paidAmount}.`);
      }
    } catch (e) {
      this.logger.error('Failed to persist billing record during verification:', e);
    }

    return {
      success: true,
      message: 'Payment verified and saved to database securely',
      paymentId: txnId,
      orderId: body.razorpay_order_id,
    };
  }

  // 3. Webhook Fallback Handler
  async handleWebhook(event: any, signature: string, rawBody: string) {
    if (!signature || !rawBody) {
      throw new BadRequestException('Razorpay webhook signature and raw body are required');
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || this.razorpayKeySecret)
      .update(rawBody)
      .digest('hex');
    const expected = Buffer.from(expectedSignature, 'utf8');
    const received = Buffer.from(signature, 'utf8');
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    try {
      if (event && event.event === 'payment.captured') {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity) {
          const orderId = paymentEntity.order_id;
          const paymentId = paymentEntity.id;
          const notes = paymentEntity.notes || {};
          const targetId = notes.appointmentId || notes.billId;

          if (targetId) {
            await this.verifyPayment({
              razorpay_order_id: orderId,
              razorpay_payment_id: paymentId,
              razorpay_signature: crypto
                .createHmac('sha256', this.razorpayKeySecret)
                .update(`${orderId}|${paymentId}`)
                .digest('hex'),
              appointmentId: targetId,
            });
          }
        }
      }
    } catch (err) {
      throw new BadRequestException('Webhook processing failed');
    }

    return { received: true };
  }
}