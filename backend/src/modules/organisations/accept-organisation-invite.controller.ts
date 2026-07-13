import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { CustomersService } from '../customers/services/customers.service';
import { OrganisationInvitesService } from './services/organisation-invites.service';

@Controller('api/organisation-invites')
@UseGuards(CustomerAuthGuard)
export class AcceptOrganisationInviteController {
  constructor(
    private readonly organisationInvitesService: OrganisationInvitesService,
    private readonly customersService: CustomersService,
  ) {}

  @Post(':token/accept')
  async accept(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('token') token: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationInvitesService.accept(
      customer.id,
      request.customerSession.user.email,
      token,
    );
  }
}
