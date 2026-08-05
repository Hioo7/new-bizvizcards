import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  upsertOrganisationExchangeContactFormTemplateSchema,
  type UpsertOrganisationExchangeContactFormTemplateDto,
} from '../exchange-contact-forms/dto/upsert-organisation-exchange-contact-form-template.dto';
import { CustomersService } from '../customers/services/customers.service';
import { OrganisationExchangeContactFormTemplateService } from './services/organisation-exchange-contact-form-template.service';

// SPOC-side (customer-authenticated) exchange-contact-form template
// management. Mirrors organisation-ecard-template.controller.ts's shape
// exactly: the controller does no authorization itself — it resolves the
// acting customer and delegates, and the service is what actually calls
// organisationsService.assertIsSpoc (for the write) / assertIsMember (for
// the read) as its first statement.
@Controller('api/organisations/:organisationId/exchange-contact-form-template')
@UseGuards(CustomerAuthGuard)
export class OrganisationExchangeContactFormTemplateController {
  constructor(
    private readonly organisationExchangeContactFormTemplateService: OrganisationExchangeContactFormTemplateService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async get(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationExchangeContactFormTemplateService.getForMember(
      customer.id,
      organisationId,
    );
  }

  @Put()
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
    @Body(
      new ZodValidationPipe(
        upsertOrganisationExchangeContactFormTemplateSchema,
      ),
    )
    dto: UpsertOrganisationExchangeContactFormTemplateDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationExchangeContactFormTemplateService.upsertForSpoc(
      customer.id,
      organisationId,
      dto,
    );
  }

  @Delete()
  async delete(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.organisationExchangeContactFormTemplateService.deleteForSpoc(
      customer.id,
      organisationId,
    );
  }
}
