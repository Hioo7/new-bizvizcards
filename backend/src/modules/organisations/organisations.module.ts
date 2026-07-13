import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { AcceptOrganisationInviteController } from './accept-organisation-invite.controller';
import { EmployeeOrganisationsController } from './employee-organisations.controller';
import { OrganisationInvitesController } from './organisation-invites.controller';
import { OrganisationMembersController } from './organisation-members.controller';
import { OrganisationsController } from './organisations.controller';
import { OrganisationInvitesService } from './services/organisation-invites.service';
import { OrganisationMembersService } from './services/organisation-members.service';
import { OrganisationsService } from './services/organisations.service';

@Module({
  imports: [CustomersModule],
  controllers: [
    OrganisationsController,
    OrganisationMembersController,
    OrganisationInvitesController,
    AcceptOrganisationInviteController,
    EmployeeOrganisationsController,
  ],
  providers: [
    OrganisationsService,
    OrganisationMembersService,
    OrganisationInvitesService,
  ],
  exports: [OrganisationsService, OrganisationMembersService],
})
export class OrganisationsModule {}
