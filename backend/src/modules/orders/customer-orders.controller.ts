import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { placeOrderSchema } from './dto/place-order.dto';
import type { PlaceOrderDto } from './dto/place-order.dto';
import { OrdersService } from './services/orders.service';

@Controller('api/orders')
@UseGuards(CustomerAuthGuard)
export class CustomerOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  async place(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(placeOrderSchema)) dto: PlaceOrderDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.ordersService.placeOrderForCustomer(customer.id, dto);
  }

  @Get()
  async listMine(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.ordersService.listForCustomer(customer.id);
  }

  @Get(':orderId')
  async getMine(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('orderId') orderId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.ordersService.getForCustomer(customer.id, orderId);
  }
}
