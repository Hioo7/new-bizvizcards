import { createHmac } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Razorpay from 'razorpay';
import { AppConfigService } from '../../common/config/app-config.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderStatus } from '../../generated/prisma/client';
import {
  PAYMENT_CURRENCY,
  PAYMENT_RECEIPT_MAX_LENGTH,
} from './payments.constants';
import type { InitiatePaymentDto } from './dto/initiate-payment.dto';
import type { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Lazily instantiate Razorpay so the service can be constructed even when
   * keys are not yet configured (app still boots; calls throw at invocation).
   */
  private getRazorpay(): Razorpay {
    if (this.razorpay) return this.razorpay;
    const keyId = this.config.razorpayKeyId;
    const keySecret = this.config.razorpayKeySecret;
    if (!keyId || !keySecret) {
      throw new BadRequestException('Payment gateway is not configured');
    }
    this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    return this.razorpay;
  }

  /**
   * Creates a Razorpay order for the given app order and stores the
   * razorpayOrderId on it. Returns the details the frontend needs to open
   * the Razorpay checkout modal.
   */
  async initiate(customerId: string, dto: InitiatePaymentDto) {
    const rzp = this.getRazorpay();

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, customerId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PLACED) {
      throw new BadRequestException(
        'Payment can only be initiated for orders in PLACED status',
      );
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);
    const receipt = order.id.slice(0, PAYMENT_RECEIPT_MAX_LENGTH);

    const razorpayOrder = await rzp.orders.create({
      amount: amountInPaise,
      currency: PAYMENT_CURRENCY,
      receipt,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: Number(razorpayOrder.amount),
      currency: razorpayOrder.currency,
      keyId: this.config.razorpayKeyId,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
    };
  }

  /**
   * Verifies the Razorpay payment signature. On success, stores the payment
   * ID and transitions the order from PLACED → CONFIRMED.
   */
  async verify(customerId: string, dto: VerifyPaymentDto) {
    const keySecret = this.config.razorpayKeySecret;
    if (!keySecret) {
      throw new BadRequestException('Payment gateway is not configured');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, customerId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.razorpayOrderId) {
      throw new BadRequestException('Payment has not been initiated for this order');
    }

    // Razorpay signature = HMAC-SHA256(key_secret, razorpay_order_id + "|" + razorpay_payment_id)
    const expected = createHmac('sha256', keySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expected !== dto.razorpaySignature) {
      throw new BadRequestException('Payment verification failed: invalid signature');
    }

    // Store payment ID and transition order to CONFIRMED
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          status: OrderStatus.CONFIRMED,
          updatedAt: new Date(),
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PLACED,
          toStatus: OrderStatus.CONFIRMED,
        },
      }),
    ]);

    return { success: true, orderId: order.id };
  }
}
