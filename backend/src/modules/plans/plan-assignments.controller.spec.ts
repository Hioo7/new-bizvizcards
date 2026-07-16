import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PlanAssignmentsController } from './plan-assignments.controller';
import type { PlanAssignmentsService } from './services/plan-assignments.service';
import type { PlanPolicyResolverService } from './services/plan-policy-resolver.service';

function makeController(
  planAssignmentsService: Partial<PlanAssignmentsService> = {},
  policyResolver: Partial<PlanPolicyResolverService> = {},
) {
  return new PlanAssignmentsController(
    planAssignmentsService as PlanAssignmentsService,
    policyResolver as PlanPolicyResolverService,
  );
}

function makeRequest(accountId = 'employee-account-1') {
  return {
    employeeSession: { user: { id: accountId } },
  } as EmployeeAuthenticatedRequest;
}

describe('PlanAssignmentsController', () => {
  it('assign forwards customerId, planId, and the acting account id', async () => {
    const assign = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ assign });

    await controller.assign(makeRequest(), 'customer-1', {
      planId: 'plan-1',
    });

    expect(assign).toHaveBeenCalledWith(
      'customer-1',
      'plan-1',
      'employee-account-1',
    );
  });

  it('switchPlan forwards customerId, planId, and the acting account id', async () => {
    const switchPlan = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ switchPlan });

    await controller.switchPlan(makeRequest(), 'customer-1', {
      planId: 'plan-2',
    });

    expect(switchPlan).toHaveBeenCalledWith(
      'customer-1',
      'plan-2',
      'employee-account-1',
    );
  });

  it('renew forwards customerId and the acting account id', async () => {
    const renew = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ renew });

    await controller.renew(makeRequest(), 'customer-1');

    expect(renew).toHaveBeenCalledWith('customer-1', 'employee-account-1');
  });

  it('cancel forwards customerId', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ cancel });

    await controller.cancel('customer-1');

    expect(cancel).toHaveBeenCalledWith('customer-1');
  });

  it('listHistory forwards customerId', async () => {
    const listPurchaseHistory = jest.fn().mockResolvedValue([]);
    const controller = makeController({ listPurchaseHistory });

    await controller.listHistory('customer-1');

    expect(listPurchaseHistory).toHaveBeenCalledWith('customer-1');
  });

  it('getEffectivePolicy forwards customerId to the policy resolver', async () => {
    const getEffectivePolicyForCustomer = jest
      .fn()
      .mockResolvedValue({ planId: 'plan-1', isFallback: false });
    const controller = makeController({}, { getEffectivePolicyForCustomer });

    await controller.getEffectivePolicy('customer-1');

    expect(getEffectivePolicyForCustomer).toHaveBeenCalledWith('customer-1');
  });
});
