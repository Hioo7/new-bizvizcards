import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { createOrganisationSchema } from './dto/create-organisation.dto';
import type { CreateOrganisationDto } from './dto/create-organisation.dto';
import { updateOrganisationSchema } from './dto/update-organisation.dto';
import type { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsService } from './services/organisations.service';

@Controller('api/organisations')
@UseGuards(CustomerAuthGuard)
export class OrganisationsController {
  constructor(
    private readonly organisationsService: OrganisationsService,
    private readonly customersService: CustomersService,
  ) {}

  @Get('me')
  async getMine(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationsService.getMine(customer.id);
  }

  @Post()
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(createOrganisationSchema))
    dto: CreateOrganisationDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationsService.create(customer.id, dto);
  }

  @Patch('me')
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(updateOrganisationSchema))
    dto: UpdateOrganisationDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationsService.update(customer.id, dto);
  }
}
