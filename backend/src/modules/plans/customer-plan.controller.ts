import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { CustomersService } from '../customers/services/customers.service';
import { PlanPolicyResolverService } from './services/plan-policy-resolver.service';

@Controller('api/customer/plan')
@UseGuards(CustomerAuthGuard)
export class CustomerPlanController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly policyResolver: PlanPolicyResolverService,
  ) {}

  @Get('effective-policy')
  async getEffectivePolicy(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const [policy, leadsViewAccess] = await Promise.all([
      this.policyResolver.getEffectivePolicyForCustomer(customer.id),
      this.policyResolver.getLeadViewAccess(customer.id),
    ]);
    return { ...policy, leadsViewAccess };
  }
}
