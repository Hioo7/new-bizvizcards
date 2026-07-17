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
import { createAddressSchema } from './dto/create-address.dto';
import type { CreateAddressDto } from './dto/create-address.dto';
import { updateAddressSchema } from './dto/update-address.dto';
import type { UpdateAddressDto } from './dto/update-address.dto';
import { AddressesService } from './services/addresses.service';

@Controller('api/addresses')
@UseGuards(CustomerAuthGuard)
export class AddressesController {
  constructor(
    private readonly addressesService: AddressesService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async list(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.addressesService.listForCustomer(customer.id);
  }

  @Post()
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(createAddressSchema)) dto: CreateAddressDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.addressesService.create(customer.id, dto);
  }

  @Patch(':addressId')
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('addressId') addressId: string,
    @Body(new ZodValidationPipe(updateAddressSchema)) dto: UpdateAddressDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.addressesService.update(customer.id, addressId, dto);
  }

  @Delete(':addressId')
  async remove(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('addressId') addressId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.addressesService.remove(customer.id, addressId);
  }
}
