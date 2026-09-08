import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @HttpCode(HttpStatus.OK)
  async createOrder(@Body() body: { billId?: string; amount?: number }) {
    return this.paymentService.createOrder(body.billId || '', body.amount);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature?: string;
      billId?: string;
      appointmentId?: string;
      amount?: number;
    },
  ) {
    return this.paymentService.verifyPayment(body);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async razorpayWebhook(@Body() event: any, @Req() req: any) {
    const signature = req.headers['x-razorpay-signature'];
    return this.paymentService.handleWebhook(event, signature);
  }
}