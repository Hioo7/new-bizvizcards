import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { inviteMemberSchema } from './dto/invite-member.dto';
import type { InviteMemberDto } from './dto/invite-member.dto';
import { OrganisationInvitesService } from './services/organisation-invites.service';

@Controller('api/organisations/invites')
@UseGuards(CustomerAuthGuard)
export class OrganisationInvitesController {
  constructor(
    private readonly organisationInvitesService: OrganisationInvitesService,
    private readonly customersService: CustomersService,
  ) {}

  @Get(':organisationId')
  async list(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationInvitesService.list(customer.id, organisationId);
  }

  @Post(':organisationId')
  async invite(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
    @Body(new ZodValidationPipe(inviteMemberSchema)) dto: InviteMemberDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationInvitesService.invite(
      customer.id,
      organisationId,
      dto,
    );
  }

  @Delete(':id')
  async revoke(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.organisationInvitesService.revoke(customer.id, id);
  }
}
