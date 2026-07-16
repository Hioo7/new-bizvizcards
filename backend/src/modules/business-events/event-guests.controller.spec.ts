import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { EventGuestsController } from './event-guests.controller';
import type { EventGuestsService } from './services/event-guests.service';

function makeController(
  eventGuestsService: Partial<EventGuestsService> = {},
  customersService: Partial<CustomersService> = {},
) {
  return new EventGuestsController(
    eventGuestsService as EventGuestsService,
    customersService as CustomersService,
  );
}

function makeRequest(accountId = 'account-1') {
  return {
    customerSession: { user: { id: accountId } },
  } as CustomerAuthenticatedRequest;
}

describe('EventGuestsController', () => {
  it('addGuest resolves the real customer id then delegates to addAsHostOrCoHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const addAsHostOrCoHost = jest.fn().mockResolvedValue({ id: 'guest-1' });
    const controller = makeController(
      { addAsHostOrCoHost },
      { getByAccountId },
    );

    await controller.addGuest(makeRequest(), 'event-1', {
      customerId: 'customer-2',
    });

    expect(addAsHostOrCoHost).toHaveBeenCalledWith('customer-1', 'event-1', {
      customerId: 'customer-2',
    });
  });

  it('bulkAddGuests delegates to bulkAddAsHostOrCoHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const bulkAddAsHostOrCoHost = jest.fn().mockResolvedValue([]);
    const controller = makeController(
      { bulkAddAsHostOrCoHost },
      { getByAccountId },
    );

    await controller.bulkAddGuests(makeRequest(), 'event-1', {
      customerIds: ['c1', 'c2'],
    });

    expect(bulkAddAsHostOrCoHost).toHaveBeenCalledWith(
      'customer-1',
      'event-1',
      {
        customerIds: ['c1', 'c2'],
      },
    );
  });

  it('removeGuest delegates to removeAsHostOrCoHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const removeAsHostOrCoHost = jest.fn().mockResolvedValue(undefined);
    const controller = makeController(
      { removeAsHostOrCoHost },
      { getByAccountId },
    );

    await controller.removeGuest(makeRequest(), 'event-1', 'guest-1');

    expect(removeAsHostOrCoHost).toHaveBeenCalledWith(
      'customer-1',
      'event-1',
      'guest-1',
    );
  });
});
