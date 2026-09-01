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
import {
  bulkMessagePlaceholdersQuerySchema,
  type BulkMessagePlaceholdersQueryDto,
} from './dto/placeholders-query.dto';
import {
  createBulkMessageSendSchema,
  type CreateBulkMessageSendDto,
} from './dto/create-bulk-message-send.dto';
import {
  createBulkMessageTemplateSchema,
  type CreateBulkMessageTemplateDto,
} from './dto/create-bulk-message-template.dto';
import {
  updateBulkMessageTemplateSchema,
  type UpdateBulkMessageTemplateDto,
} from './dto/update-bulk-message-template.dto';
import { BulkMessagePlaceholderService } from './services/bulk-message-placeholder.service';
import { BulkMessageSendsService } from './services/bulk-message-sends.service';
import { BulkMessageTemplatesService } from './services/bulk-message-templates.service';

// Personal Bulk Messenger management for the logged-in customer — no
// admin/employee surface. Mirrors CustomerEmailSignaturesController's shape:
// same guard, same "resolve customer via customersService.getByAccountId"
// boilerplate per handler, 404-not-403 ownership enforced inside the services.
@Controller('api/bulk-messenger')
@UseGuards(CustomerAuthGuard)
export class CustomerBulkMessengerController {
  constructor(
    private readonly templatesService: BulkMessageTemplatesService,
    private readonly sendsService: BulkMessageSendsService,
    private readonly placeholderService: BulkMessagePlaceholderService,
    private readonly customersService: CustomersService,
  ) {}

  // ── templates ──────────────────────────────────────────────────────────────

  @Get('templates')
  async listTemplates(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.resolveCustomer(request);
    return this.templatesService.listForCustomer(customer.id);
  }

  // Declared before `templates/:id` so the literal segment wins the match.
  @Get('templates/placeholders')
  async getPlaceholders(
    @Req() request: CustomerAuthenticatedRequest,
    @Query(new ZodValidationPipe(bulkMessagePlaceholdersQuerySchema))
    query: BulkMessagePlaceholdersQueryDto,
  ) {
    const customer = await this.resolveCustomer(request);
    return this.placeholderService.getAvailablePlaceholders(
      customer.id,
      query.formId ?? null,
    );
  }

  @Get('templates/:id')
  async getTemplate(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const customer = await this.resolveCustomer(request);
    return this.templatesService.getDetailForCustomer(customer.id, id);
  }

  @Get('templates/:id/valid-leads')
  async getTemplateValidLeads(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const customer = await this.resolveCustomer(request);
    return this.sendsService.getValidLeadsForTemplate(customer.id, id);
  }

  @Post('templates')
  async createTemplate(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(createBulkMessageTemplateSchema))
    dto: CreateBulkMessageTemplateDto,
  ) {
    const customer = await this.resolveCustomer(request);
    return this.templatesService.create(customer.id, dto);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBulkMessageTemplateSchema))
    dto: UpdateBulkMessageTemplateDto,
  ) {
    const customer = await this.resolveCustomer(request);
    return this.templatesService.update(customer.id, id, dto);
  }

  @Delete('templates/:id')
  async deleteTemplate(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.resolveCustomer(request);
    await this.templatesService.delete(customer.id, id);
  }

  // ── sends ──────────────────────────────────────────────────────────────────

  @Get('sends')
  async listSends(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.resolveCustomer(request);
    return this.sendsService.listForCustomer(customer.id);
  }

  @Get('sends/:id')
  async getSend(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const customer = await this.resolveCustomer(request);
    return this.sendsService.getDetailForCustomer(customer.id, id);
  }

  @Post('sends')
  async createSend(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(createBulkMessageSendSchema))
    dto: CreateBulkMessageSendDto,
  ) {
    const customer = await this.resolveCustomer(request);
    return this.sendsService.createSend(customer.id, dto);
  }

  @Patch('sends/:sendId/recipients/:recipientId')
  async markRecipientMessaged(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('sendId') sendId: string,
    @Param('recipientId') recipientId: string,
  ): Promise<void> {
    const customer = await this.resolveCustomer(request);
    await this.sendsService.markRecipientMessaged(
      customer.id,
      sendId,
      recipientId,
    );
  }

  @Delete('sends/:id')
  async deleteSend(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.resolveCustomer(request);
    await this.sendsService.deleteSend(customer.id, id);
  }

  private resolveCustomer(request: CustomerAuthenticatedRequest) {
    return this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
  }
}
