import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { EventScanController } from './event-scan.controller';
import type { EventScanningService } from './services/event-scanning.service';

function makeController(
  eventScanningService: Partial<EventScanningService> = {},
  customersService: Partial<CustomersService> = {},
) {
  return new EventScanController(
    eventScanningService as EventScanningService,
    customersService as CustomersService,
  );
}

function makeRequest(accountId = 'account-1') {
  return {
    customerSession: { user: { id: accountId } },
  } as CustomerAuthenticatedRequest;
}

describe('EventScanController', () => {
  it('scanGate resolves the real customer id then delegates to eventScanningService.scanGate', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const scanGate = jest.fn().mockResolvedValue({ eventGuestId: 'guest-1' });
    const controller = makeController({ scanGate }, { getByAccountId });

    await controller.scanGate(makeRequest(), 'event-1', {
      cardType: 'ECARD',
      endpoint: 'jane-doe',
    });

    expect(getByAccountId).toHaveBeenCalledWith('account-1');
    expect(scanGate).toHaveBeenCalledWith('event-1', 'customer-1', {
      cardType: 'ECARD',
      endpoint: 'jane-doe',
    });
  });

  it('scanTrackable delegates to eventScanningService.scanTrackable', async () => {
    const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const scanTrackable = jest
      .fn()
      .mockResolvedValue({ redemptionId: 'redemption-1' });
    const controller = makeController({ scanTrackable }, { getByAccountId });

    await controller.scanTrackable(makeRequest(), 'event-1', 'trackable-1', {
      cardType: 'SMART_CARD',
      endpoint: 'jane-doe-smart',
    });

    expect(scanTrackable).toHaveBeenCalledWith(
      'event-1',
      'trackable-1',
      'customer-1',
      { cardType: 'SMART_CARD', endpoint: 'jane-doe-smart' },
    );
  });
});
