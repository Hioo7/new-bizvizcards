import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { EventMembersController } from './event-members.controller';
import type { EventMembersService } from './services/event-members.service';

function makeController(
  eventMembersService: Partial<EventMembersService> = {},
  customersService: Partial<CustomersService> = {},
) {
  return new EventMembersController(
    eventMembersService as EventMembersService,
    customersService as CustomersService,
  );
}

function makeRequest(accountId = 'account-1') {
  return {
    customerSession: { user: { id: accountId } },
  } as CustomerAuthenticatedRequest;
}

describe('EventMembersController', () => {
  it('addMember resolves the real customer id then delegates to addAsHostOrCoHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const addAsHostOrCoHost = jest.fn().mockResolvedValue({ id: 'member-1' });
    const controller = makeController(
      { addAsHostOrCoHost },
      { getByAccountId },
    );

    await controller.addMember(makeRequest(), 'event-1', {
      customerId: 'customer-2',
      role: 'VOLUNTEER',
    });

    expect(getByAccountId).toHaveBeenCalledWith('account-1');
    expect(addAsHostOrCoHost).toHaveBeenCalledWith('customer-1', 'event-1', {
      customerId: 'customer-2',
      role: 'VOLUNTEER',
    });
  });

  it('removeMember delegates to removeAsHostOrCoHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const removeAsHostOrCoHost = jest.fn().mockResolvedValue(undefined);
    const controller = makeController(
      { removeAsHostOrCoHost },
      { getByAccountId },
    );

    await controller.removeMember(makeRequest(), 'event-1', 'member-1');

    expect(removeAsHostOrCoHost).toHaveBeenCalledWith(
      'customer-1',
      'event-1',
      'member-1',
    );
  });
});
