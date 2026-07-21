import { Module } from '@nestjs/common';
import { MediaModule } from '../../common/media/media.module';
import { CustomersModule } from '../customers/customers.module';
import { PlansModule } from '../plans/plans.module';
import { AcceptOrganisationInviteController } from './accept-organisation-invite.controller';
import { EmployeeOrganisationsController } from './employee-organisations.controller';
import { OrganisationEcardTemplateController } from './organisation-ecard-template.controller';
import { OrganisationInvitesController } from './organisation-invites.controller';
import { OrganisationMembersController } from './organisation-members.controller';
import { OrganisationsController } from './organisations.controller';
import { OrganisationEcardTemplateService } from './services/organisation-ecard-template.service';
import { OrganisationInvitesService } from './services/organisation-invites.service';
import { OrganisationMembersService } from './services/organisation-members.service';
import { OrganisationsService } from './services/organisations.service';

@Module({
  imports: [CustomersModule, PlansModule, MediaModule],
  controllers: [
    OrganisationsController,
    OrganisationMembersController,
    OrganisationInvitesController,
    AcceptOrganisationInviteController,
    EmployeeOrganisationsController,
    OrganisationEcardTemplateController,
  ],
  providers: [
    OrganisationsService,
    OrganisationMembersService,
    OrganisationInvitesService,
    OrganisationEcardTemplateService,
  ],
  exports: [
    OrganisationsService,
    OrganisationMembersService,
    OrganisationEcardTemplateService,
  ],
})
export class OrganisationsModule {}
