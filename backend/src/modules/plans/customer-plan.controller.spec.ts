import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { CustomerPlanController } from './customer-plan.controller';
import type { PlanPolicyResolverService } from './services/plan-policy-resolver.service';

function makeController(
  customersService: Partial<CustomersService> = {},
  policyResolver: Partial<PlanPolicyResolverService> = {},
) {
  return new CustomerPlanController(
    customersService as CustomersService,
    policyResolver as PlanPolicyResolverService,
  );
}

function makeRequest(accountId = 'customer-account-1') {
  return {
    customerSession: { user: { id: accountId } },
  } as CustomerAuthenticatedRequest;
}

describe('CustomerPlanController', () => {
  it('resolves the acting customer then returns the effective policy plus lead view access', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const getEffectivePolicyForCustomer = jest.fn().mockResolvedValue({
      planId: 'plan-1',
      isFallback: false,
      ecard: {},
      smartCard: {},
      organisation: {},
    });
    const getLeadViewAccess = jest.fn().mockResolvedValue(true);
    const controller = makeController(
      { getByAccountId },
      { getEffectivePolicyForCustomer, getLeadViewAccess },
    );

    const result = await controller.getEffectivePolicy(makeRequest());

    expect(getByAccountId).toHaveBeenCalledWith('customer-account-1');
    expect(getEffectivePolicyForCustomer).toHaveBeenCalledWith('customer-1');
    expect(getLeadViewAccess).toHaveBeenCalledWith('customer-1');
    expect(result).toEqual({
      planId: 'plan-1',
      isFallback: false,
      ecard: {},
      smartCard: {},
      organisation: {},
      leadsViewAccess: true,
    });
  });
});
