import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  LEAD_REMINDER_TEXT_MAX_LENGTH,
  LEAD_REMINDER_TITLE_MAX_LENGTH,
  REMINDER_DUE_WINDOW_DEFAULT_MINUTES,
  REMINDER_DUE_WINDOW_MAX_MINUTES,
} from '../../../leads/leads.constants';
import type { RemindersService } from '../../../leads/services/reminders.service';
import { textResult } from '../../mcp-tool-result.util';

const listLeadRemindersInputSchema = z.object({ leadId: z.string().uuid() });

const addLeadReminderInputSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().trim().min(1).max(LEAD_REMINDER_TITLE_MAX_LENGTH),
  text: z.string().trim().max(LEAD_REMINDER_TEXT_MAX_LENGTH).optional(),
  // A plain ISO datetime string, not z.coerce.date() — the MCP SDK exposes
  // every tool's inputSchema as JSON Schema for tools/list, and a Date type
  // has no JSON Schema representation (the SDK throws "Date cannot be
  // represented in JSON Schema" at that point). Parsed to a Date manually in
  // the handler below instead.
  triggerAt: z.iso.datetime(),
});

const listDueRemindersInputSchema = z.object({
  withinMinutes: z
    .number()
    .int()
    .min(0)
    .max(REMINDER_DUE_WINDOW_MAX_MINUTES)
    .optional(),
});

export async function listLeadRemindersHandler(
  service: RemindersService,
  customerId: string,
  args: z.infer<typeof listLeadRemindersInputSchema>,
) {
  const reminders = await service.list(customerId, args.leadId);
  return textResult(reminders);
}

export async function addLeadReminderHandler(
  service: RemindersService,
  customerId: string,
  args: z.infer<typeof addLeadReminderInputSchema>,
) {
  const reminder = await service.create(customerId, args.leadId, {
    title: args.title,
    text: args.text,
    triggerAt: new Date(args.triggerAt),
  });
  return textResult(reminder);
}

export async function listDueRemindersHandler(
  service: RemindersService,
  customerId: string,
  args: z.infer<typeof listDueRemindersInputSchema>,
) {
  const reminders = await service.getDue(
    customerId,
    args.withinMinutes ?? REMINDER_DUE_WINDOW_DEFAULT_MINUTES,
  );
  return textResult(reminders);
}

export function registerLeadReminderTools(
  server: McpServer,
  deps: { remindersService: RemindersService },
  customerId: string,
): void {
  server.registerTool(
    'list_lead_reminders',
    {
      title: 'List Lead Reminders',
      description: 'List reminders set on a lead.',
      inputSchema: listLeadRemindersInputSchema,
      annotations: {
        title: 'List Lead Reminders',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    (args) => listLeadRemindersHandler(deps.remindersService, customerId, args),
  );

  server.registerTool(
    'add_lead_reminder',
    {
      title: 'Add Lead Reminder',
      description: 'Add a reminder to a lead, due at a specific time.',
      inputSchema: addLeadReminderInputSchema,
      annotations: {
        title: 'Add Lead Reminder',
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    (args) => addLeadReminderHandler(deps.remindersService, customerId, args),
  );

  server.registerTool(
    'list_due_reminders',
    {
      title: 'List Due Reminders',
      description:
        "List reminders across all of the caller's leads that are due within a time window (default: overdue/now).",
      inputSchema: listDueRemindersInputSchema,
      annotations: {
        title: 'List Due Reminders',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    (args) => listDueRemindersHandler(deps.remindersService, customerId, args),
  );
}
