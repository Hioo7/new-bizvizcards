import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { linkProductUnitSchema } from './dto/link-product-unit.dto';
import type { LinkProductUnitDto } from './dto/link-product-unit.dto';
import { ProductLinkService } from './services/product-link.service';

@Controller('api/product-units')
@UseGuards(CustomerAuthGuard)
export class CustomerProductLinkController {
  constructor(
    private readonly productLinkService: ProductLinkService,
    private readonly customersService: CustomersService,
  ) {}

  @Post(':code/claim')
  async claim(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('code') code: string,
    @Body(new ZodValidationPipe(linkProductUnitSchema)) dto: LinkProductUnitDto,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.productLinkService.claim(code, customer.id, dto);
  }

  @Post(':code/relink')
  async relink(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('code') code: string,
    @Body(new ZodValidationPipe(linkProductUnitSchema)) dto: LinkProductUnitDto,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.productLinkService.relink(code, customer.id, dto);
  }

  @Delete(':code/unlink')
  async unlink(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('code') code: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.productLinkService.unlink(code, customer.id);
  }
}
