import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import {
  createMyExchangeContactFormSchema,
  type CreateMyExchangeContactFormDto,
} from './dto/create-my-exchange-contact-form.dto';
import {
  linkExchangeContactFormEcardsSchema,
  type LinkExchangeContactFormEcardsDto,
} from './dto/link-exchange-contact-form-ecards.dto';
import {
  updateExchangeContactFormSchema,
  type UpdateExchangeContactFormDto,
} from './dto/update-exchange-contact-form.dto';
import { EXCHANGE_CONTACT_FORM_NOT_FOUND_MESSAGE } from './exchange-contact-forms.constants';
import { ExchangeContactFormsService } from './services/exchange-contact-forms.service';

// Personal exchange-contact-form management for the logged-in customer.
// Mirrors ecards.controller.ts's shape exactly: same guard, same
// "resolve customer via customersService.getByAccountId" boilerplate per
// handler, same 404-not-403 ownership-check convention (getOwnedFormOrThrow
// below mirrors EcardsController.getOwnedCardOrThrow verbatim). None of the
// underlying ExchangeContactFormsService methods need changes — they already
// operate purely on formId; the employee controller relies on RBAC instead
// of ownership, so this controller-level check is the only new
// authorization logic needed here.
@Controller('api/exchange-contact-forms')
@UseGuards(CustomerAuthGuard)
export class CustomerExchangeContactFormsController {
  constructor(
    private readonly exchangeContactFormsService: ExchangeContactFormsService,
    private readonly customersService: CustomersService,
  ) {}

  @Get('me')
  async listMine(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.exchangeContactFormsService.listForCustomer(customer.id);
  }

  @Get('me/:formId')
  async getMine(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('formId') formId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.getOwnedFormOrThrow(formId, customer.id);
  }

  @Post('me')
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(createMyExchangeContactFormSchema))
    dto: CreateMyExchangeContactFormDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.exchangeContactFormsService.create({
      ...dto,
      customerId: customer.id,
    });
  }

  @Patch('me/:formId')
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('formId') formId: string,
    @Body(new ZodValidationPipe(updateExchangeContactFormSchema))
    dto: UpdateExchangeContactFormDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedFormOrThrow(formId, customer.id);
    return this.exchangeContactFormsService.update(formId, dto);
  }

  @Delete('me/:formId')
  async remove(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('formId') formId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedFormOrThrow(formId, customer.id);
    await this.exchangeContactFormsService.deleteForm(formId);
  }

  @Get('me/:formId/versions')
  async listVersions(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('formId') formId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedFormOrThrow(formId, customer.id);
    return this.exchangeContactFormsService.listVersions(formId);
  }

  @Delete('me/:formId/versions/:versionId')
  async removeVersion(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('formId') formId: string,
    @Param('versionId') versionId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedFormOrThrow(formId, customer.id);
    await this.exchangeContactFormsService.deleteVersion(formId, versionId);
  }

  @Put('me/:formId/linked-ecards')
  async setLinkedEcards(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('formId') formId: string,
    @Body(new ZodValidationPipe(linkExchangeContactFormEcardsSchema))
    dto: LinkExchangeContactFormEcardsDto,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedFormOrThrow(formId, customer.id);
    await this.exchangeContactFormsService.setLinkedEcards(
      formId,
      dto.ecardIds,
    );
  }

  // Fetches the form by id and confirms it belongs to the given customer,
  // throwing 404 (not 403) either way so a foreign form's existence isn't
  // leaked to a customer who doesn't own it.
  private async getOwnedFormOrThrow(formId: string, customerId: string) {
    const form = await this.exchangeContactFormsService.getById(formId);
    if (form.customerId !== customerId) {
      throw new NotFoundException(EXCHANGE_CONTACT_FORM_NOT_FOUND_MESSAGE);
    }
    return form;
  }
}
