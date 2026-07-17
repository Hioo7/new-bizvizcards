import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { addCartItemSchema } from './dto/add-cart-item.dto';
import type { AddCartItemDto } from './dto/add-cart-item.dto';
import { updateCartItemSchema } from './dto/update-cart-item.dto';
import type { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './services/cart.service';

@Controller('api/cart')
@UseGuards(CustomerAuthGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async get(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.cartService.getForCustomer(customer.id);
  }

  @Post('items')
  async addItem(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(addCartItemSchema)) dto: AddCartItemDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.cartService.addItem(customer.id, dto);
  }

  @Patch('items/:itemId')
  async updateItem(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateCartItemSchema)) dto: UpdateCartItemDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.cartService.updateItemQuantity(customer.id, itemId, dto);
  }

  @Delete('items/:itemId')
  async removeItem(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('itemId') itemId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.cartService.removeItem(customer.id, itemId);
  }

  @Delete()
  async clear(@Req() request: CustomerAuthenticatedRequest): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.cartService.clear(customer.id);
  }
}
