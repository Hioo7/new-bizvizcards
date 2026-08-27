import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { createLeadSchema } from './dto/create-lead.dto';
import type { CreateLeadDto } from './dto/create-lead.dto';
import { exportLeadsSchema } from './dto/export-leads.dto';
import type { ExportLeadsDto } from './dto/export-leads.dto';
import { listLeadsQuerySchema } from './dto/list-leads-query.dto';
import type { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { updateLeadSchema } from './dto/update-lead.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';
import {
  LEAD_EXPORT_CONTENT_TYPE,
  LEAD_EXPORT_FILENAME_PREFIX,
} from './leads.constants';
import { LeadExportService } from './services/lead-export.service';
import { LeadsService } from './services/leads.service';

@Controller('api/leads')
@UseGuards(CustomerAuthGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly customersService: CustomersService,
    private readonly leadExportService: LeadExportService,
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

  @Get('unseen-count')
  async getUnseenCount(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadsService.getUnseenCount(customer.id);
  }

  @Post('mark-seen')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllSeen(
    @Req() request: CustomerAuthenticatedRequest,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.leadsService.markAllSeen(customer.id);
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

  @Post('export')
  @HttpCode(HttpStatus.OK)
  async export(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(exportLeadsSchema)) dto: ExportLeadsDto,
    @Res() res: Response,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const buffer = await this.leadExportService.generateWorkbook(
      customer.id,
      dto.leadIds,
    );

    res.setHeader('Content-Type', LEAD_EXPORT_CONTENT_TYPE);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${LEAD_EXPORT_FILENAME_PREFIX}${Date.now()}.xlsx"`,
    );
    res.send(buffer);
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
