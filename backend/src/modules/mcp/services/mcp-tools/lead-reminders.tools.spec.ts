import type { RemindersService } from '../../../leads/services/reminders.service';
import {
  addLeadReminderHandler,
  listDueRemindersHandler,
  listLeadRemindersHandler,
} from './lead-reminders.tools';

describe('lead reminders MCP tool handlers', () => {
  it('listLeadRemindersHandler lists reminders for the lead scoped to the customer', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const service = { list } as unknown as RemindersService;

    await listLeadRemindersHandler(service, 'customer-1', {
      leadId: 'lead-1',
    });

    expect(list).toHaveBeenCalledWith('customer-1', 'lead-1');
  });

  it('addLeadReminderHandler creates a reminder scoped to the customer and lead', async () => {
    const triggerAtIso = '2026-09-10T09:00:00.000Z';
    const create = jest
      .fn()
      .mockResolvedValue({ id: 'reminder-1', title: 'Call back' });
    const service = { create } as unknown as RemindersService;

    const result = await addLeadReminderHandler(service, 'customer-1', {
      leadId: 'lead-1',
      title: 'Call back',
      triggerAt: triggerAtIso,
    });

    expect(create).toHaveBeenCalledWith('customer-1', 'lead-1', {
      title: 'Call back',
      text: undefined,
      triggerAt: new Date(triggerAtIso),
    });
    expect(result.content[0].text).toContain('reminder-1');
  });

  it('listDueRemindersHandler defaults withinMinutes and scopes to the customer', async () => {
    const getDue = jest.fn().mockResolvedValue([]);
    const service = { getDue } as unknown as RemindersService;

    await listDueRemindersHandler(service, 'customer-1', {});

    expect(getDue).toHaveBeenCalledWith('customer-1', 0);
  });
});
