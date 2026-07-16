import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { EventsController } from './events.controller';
import type { EventGuestsService } from './services/event-guests.service';
import type { EventMembersService } from './services/event-members.service';
import type { EventTrackablesService } from './services/event-trackables.service';
import type { EventsService } from './services/events.service';

function makeController(
  eventsService: Partial<EventsService> = {},
  eventMembersService: Partial<EventMembersService> = {},
  eventGuestsService: Partial<EventGuestsService> = {},
  eventTrackablesService: Partial<EventTrackablesService> = {},
) {
  return new EventsController(
    eventsService as EventsService,
    eventMembersService as EventMembersService,
    eventGuestsService as EventGuestsService,
    eventTrackablesService as EventTrackablesService,
  );
}

function makeRequest(accountId = 'employee-account-1') {
  return {
    employeeSession: { user: { id: accountId } },
  } as EmployeeAuthenticatedRequest;
}

describe('EventsController', () => {
  it('list forwards the parsed query', async () => {
    const listAllForEmployee = jest.fn().mockResolvedValue({ events: [] });
    const controller = makeController({ listAllForEmployee });

    const query = { page: 1, pageSize: 20 };
    await controller.list(query);

    expect(listAllForEmployee).toHaveBeenCalledWith(query);
  });

  it('create forwards the dto and the acting employee id', async () => {
    const createAsEmployee = jest.fn().mockResolvedValue({ id: 'event-1' });
    const controller = makeController({ createAsEmployee });

    await controller.create(makeRequest(), {
      customerId: 'customer-1',
      name: 'Gala',
      startAt: new Date('2026-01-01'),
    });

    expect(createAsEmployee).toHaveBeenCalledWith(
      {
        customerId: 'customer-1',
        name: 'Gala',
        startAt: new Date('2026-01-01'),
      },
      'employee-account-1',
    );
  });

  it('remove forwards the id', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ remove });

    await controller.remove('event-1');

    expect(remove).toHaveBeenCalledWith('event-1');
  });

  it('addMember delegates to eventMembersService.addAsEmployee', async () => {
    const addAsEmployee = jest.fn().mockResolvedValue({ id: 'member-1' });
    const controller = makeController({}, { addAsEmployee });

    await controller.addMember('event-1', {
      customerId: 'customer-1',
      role: 'CO_HOST',
    });

    expect(addAsEmployee).toHaveBeenCalledWith('event-1', {
      customerId: 'customer-1',
      role: 'CO_HOST',
    });
  });

  it('bulkAddGuests delegates to eventGuestsService.bulkAddAsEmployee', async () => {
    const bulkAddAsEmployee = jest.fn().mockResolvedValue([]);
    const controller = makeController({}, {}, { bulkAddAsEmployee });

    await controller.bulkAddGuests('event-1', { customerIds: ['c1', 'c2'] });

    expect(bulkAddAsEmployee).toHaveBeenCalledWith('event-1', {
      customerIds: ['c1', 'c2'],
    });
  });

  it('createTrackable delegates to eventTrackablesService.createAsEmployee', async () => {
    const createAsEmployee = jest.fn().mockResolvedValue({ id: 'trackable-1' });
    const controller = makeController({}, {}, {}, { createAsEmployee });

    await controller.createTrackable('event-1', { name: 'Gift' });

    expect(createAsEmployee).toHaveBeenCalledWith('event-1', { name: 'Gift' });
  });
});
