import { Injectable } from '@nestjs/common';
import { ExchangeContactFormsService } from '../../exchange-contact-forms/services/exchange-contact-forms.service';
import type { UpsertOrganisationExchangeContactFormTemplateDto } from '../../exchange-contact-forms/dto/upsert-organisation-exchange-contact-form-template.dto';
import { OrganisationsService } from './organisations.service';

/**
 * SPOC-facing authorization layer in front of the organisation's
 * exchange-contact-form template. Unlike OrganisationEcardTemplateService,
 * this owns no Prisma queries of its own — ExchangeContactForm is a shared
 * model with its own complete CRUD/versioning already built
 * (ExchangeContactFormsService), so this service only adds the
 * assertIsSpoc/assertIsMember authorization step in front of it, mirroring
 * OrganisationEcardTemplateService's getForMember/upsertForSpoc/
 * deleteForSpoc shape exactly.
 */
@Injectable()
export class OrganisationExchangeContactFormTemplateService {
  constructor(
    private readonly organisationsService: OrganisationsService,
    private readonly exchangeContactFormsService: ExchangeContactFormsService,
  ) {}

  async getForMember(actorCustomerId: string, organisationId: string) {
    await this.organisationsService.assertIsMember(
      actorCustomerId,
      organisationId,
    );
    return this.exchangeContactFormsService.getByOrganisationId(organisationId);
  }

  async upsertForSpoc(
    actorCustomerId: string,
    organisationId: string,
    dto: UpsertOrganisationExchangeContactFormTemplateDto,
  ) {
    await this.organisationsService.assertIsSpoc(
      actorCustomerId,
      organisationId,
    );
    return this.exchangeContactFormsService.upsertForOrganisation(
      organisationId,
      dto,
    );
  }

  async deleteForSpoc(
    actorCustomerId: string,
    organisationId: string,
  ): Promise<void> {
    await this.organisationsService.assertIsSpoc(
      actorCustomerId,
      organisationId,
    );
    await this.exchangeContactFormsService.deleteForOrganisation(
      organisationId,
    );
  }
}
