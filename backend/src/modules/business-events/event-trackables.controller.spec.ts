import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { EventTrackablesController } from './event-trackables.controller';
import type { EventTrackablesService } from './services/event-trackables.service';

function makeController(
  eventTrackablesService: Partial<EventTrackablesService> = {},
  customersService: Partial<CustomersService> = {},
) {
  return new EventTrackablesController(
    eventTrackablesService as EventTrackablesService,
    customersService as CustomersService,
  );
}

function makeRequest(accountId = 'account-1') {
  return {
    customerSession: { user: { id: accountId } },
  } as CustomerAuthenticatedRequest;
}

describe('EventTrackablesController', () => {
  it('createTrackable resolves the real customer id then delegates to createAsHostOrCoHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const createAsHostOrCoHost = jest
      .fn()
      .mockResolvedValue({ id: 'trackable-1' });
    const controller = makeController(
      { createAsHostOrCoHost },
      { getByAccountId },
    );

    await controller.createTrackable(makeRequest(), 'event-1', {
      name: 'Gift',
    });

    expect(createAsHostOrCoHost).toHaveBeenCalledWith('customer-1', 'event-1', {
      name: 'Gift',
    });
  });

  it('updateTrackable delegates to updateAsHostOrCoHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const updateAsHostOrCoHost = jest
      .fn()
      .mockResolvedValue({ id: 'trackable-1', name: 'Premium Gift' });
    const controller = makeController(
      { updateAsHostOrCoHost },
      { getByAccountId },
    );

    await controller.updateTrackable(makeRequest(), 'event-1', 'trackable-1', {
      name: 'Premium Gift',
    });

    expect(updateAsHostOrCoHost).toHaveBeenCalledWith(
      'customer-1',
      'event-1',
      'trackable-1',
      { name: 'Premium Gift' },
    );
  });

  it('removeTrackable delegates to removeAsHostOrCoHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const removeAsHostOrCoHost = jest.fn().mockResolvedValue(undefined);
    const controller = makeController(
      { removeAsHostOrCoHost },
      { getByAccountId },
    );

    await controller.removeTrackable(makeRequest(), 'event-1', 'trackable-1');

    expect(removeAsHostOrCoHost).toHaveBeenCalledWith(
      'customer-1',
      'event-1',
      'trackable-1',
    );
  });
});
