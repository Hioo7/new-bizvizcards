import { Module } from '@nestjs/common';
import { MediaModule } from '../../common/media/media.module';
import { CustomersModule } from '../customers/customers.module';
import { ExchangeContactFormsModule } from '../exchange-contact-forms/exchange-contact-forms.module';
import { PlansModule } from '../plans/plans.module';
import { AcceptOrganisationInviteController } from './accept-organisation-invite.controller';
import { EmployeeOrganisationsController } from './employee-organisations.controller';
import { OrganisationEcardTemplateController } from './organisation-ecard-template.controller';
import { OrganisationExchangeContactFormTemplateController } from './organisation-exchange-contact-form-template.controller';
import { OrganisationInviteLookupController } from './organisation-invite-lookup.controller';
import { OrganisationInvitesController } from './organisation-invites.controller';
import { OrganisationMembersController } from './organisation-members.controller';
import { OrganisationsController } from './organisations.controller';
import { OrganisationEcardTemplateService } from './services/organisation-ecard-template.service';
import { OrganisationExchangeContactFormTemplateService } from './services/organisation-exchange-contact-form-template.service';
import { OrganisationInvitesService } from './services/organisation-invites.service';
import { OrganisationMembersService } from './services/organisation-members.service';
import { OrganisationsService } from './services/organisations.service';

@Module({
  imports: [
    CustomersModule,
    PlansModule,
    MediaModule,
    ExchangeContactFormsModule,
  ],
  controllers: [
    OrganisationsController,
    OrganisationMembersController,
    OrganisationInvitesController,
    OrganisationInviteLookupController,
    AcceptOrganisationInviteController,
    EmployeeOrganisationsController,
    OrganisationEcardTemplateController,
    OrganisationExchangeContactFormTemplateController,
  ],
  providers: [
    OrganisationsService,
    OrganisationMembersService,
    OrganisationInvitesService,
    OrganisationEcardTemplateService,
    OrganisationExchangeContactFormTemplateService,
  ],
  exports: [
    OrganisationsService,
    OrganisationMembersService,
    OrganisationEcardTemplateService,
  ],
})
export class OrganisationsModule {}
