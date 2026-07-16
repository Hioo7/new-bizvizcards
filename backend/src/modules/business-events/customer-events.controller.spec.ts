import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { CustomerEventsController } from './customer-events.controller';
import type { EventsService } from './services/events.service';

function makeController(
  eventsService: Partial<EventsService> = {},
  customersService: Partial<CustomersService> = {},
) {
  return new CustomerEventsController(
    eventsService as EventsService,
    customersService as CustomersService,
  );
}

function makeRequest(accountId = 'account-1') {
  return {
    customerSession: { user: { id: accountId } },
  } as CustomerAuthenticatedRequest;
}

describe('CustomerEventsController', () => {
  it('create resolves the real customer id then delegates to eventsService.create', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const create = jest.fn().mockResolvedValue({ id: 'event-1' });
    const controller = makeController({ create }, { getByAccountId });

    await controller.create(makeRequest(), {
      name: 'Gala',
      startAt: new Date('2026-01-01'),
    });

    expect(getByAccountId).toHaveBeenCalledWith('account-1');
    expect(create).toHaveBeenCalledWith('customer-1', {
      name: 'Gala',
      startAt: new Date('2026-01-01'),
    });
  });

  it('get delegates to eventsService.getByIdForCustomerOrThrow', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const getByIdForCustomerOrThrow = jest
      .fn()
      .mockResolvedValue({ id: 'event-1' });
    const controller = makeController(
      { getByIdForCustomerOrThrow },
      { getByAccountId },
    );

    await controller.get(makeRequest(), 'event-1');

    expect(getByIdForCustomerOrThrow).toHaveBeenCalledWith(
      'customer-1',
      'event-1',
    );
  });

  it('remove delegates to eventsService.removeAsHost', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const removeAsHost = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ removeAsHost }, { getByAccountId });

    await controller.remove(makeRequest(), 'event-1');

    expect(removeAsHost).toHaveBeenCalledWith('customer-1', 'event-1');
  });
});
