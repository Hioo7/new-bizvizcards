import { z } from 'zod';
import {
  LEAD_REMINDER_TEXT_MAX_LENGTH,
  LEAD_REMINDER_TITLE_MAX_LENGTH,
} from '../leads.constants';

export const createLeadReminderSchema = z
  .object({
    title: z.string().trim().min(1).max(LEAD_REMINDER_TITLE_MAX_LENGTH),
    text: z.string().trim().max(LEAD_REMINDER_TEXT_MAX_LENGTH).optional(),
    triggerAt: z.coerce.date(),
  })
  .strict();

export type CreateLeadReminderDto = z.infer<typeof createLeadReminderSchema>;
