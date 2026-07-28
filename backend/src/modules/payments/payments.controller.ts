import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { PaymentsService } from './payments.service';
import {
  initiatePaymentSchema,
  type InitiatePaymentDto,
} from './dto/initiate-payment.dto';
import {
  verifyPaymentSchema,
  type VerifyPaymentDto,
} from './dto/verify-payment.dto';

@Controller('api/payments')
@UseGuards(CustomerAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly customersService: CustomersService,
  ) {}

  @Post('initiate')
  async initiate(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(initiatePaymentSchema)) dto: InitiatePaymentDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.paymentsService.initiate(customer.id, dto);
  }

  @Post('verify')
  async verify(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(verifyPaymentSchema)) dto: VerifyPaymentDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.paymentsService.verify(customer.id, dto);
  }
}
