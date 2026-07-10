import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { createLeadSchema } from './dto/create-lead.dto';
import type { CreateLeadDto } from './dto/create-lead.dto';
import { listLeadsQuerySchema } from './dto/list-leads-query.dto';
import type { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { updateLeadSchema } from './dto/update-lead.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './services/leads.service';

@Controller('api/leads')
@UseGuards(CustomerAuthGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async list(
    @Req() request: CustomerAuthenticatedRequest,
    @Query(new ZodValidationPipe(listLeadsQuerySchema))
    query: ListLeadsQueryDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadsService.list(customer.id, query);
  }

  @Get(':id')
  async getById(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadsService.getById(customer.id, id);
  }

  @Post()
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(createLeadSchema)) dto: CreateLeadDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadsService.create(customer.id, dto);
  }

  @Patch(':id')
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadSchema)) dto: UpdateLeadDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadsService.update(customer.id, id, dto);
  }

  @Delete(':id')
  async delete(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.leadsService.delete(customer.id, id);
  }
}
