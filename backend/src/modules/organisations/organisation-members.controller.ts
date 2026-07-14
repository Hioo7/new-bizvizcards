import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { updateMemberSchema } from './dto/update-member.dto';
import type { UpdateMemberDto } from './dto/update-member.dto';
import { OrganisationMembersService } from './services/organisation-members.service';

@Controller('api/organisations/members')
@UseGuards(CustomerAuthGuard)
export class OrganisationMembersController {
  constructor(
    private readonly organisationMembersService: OrganisationMembersService,
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
    return this.organisationMembersService.list(customer.id, organisationId);
  }

  @Patch(':id')
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMemberSchema)) dto: UpdateMemberDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationMembersService.update(customer.id, id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.organisationMembersService.remove(customer.id, id);
  }
}
