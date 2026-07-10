import { z } from 'zod';
import {
  LEAD_REMINDER_TEXT_MAX_LENGTH,
  LEAD_REMINDER_TITLE_MAX_LENGTH,
} from '../leads.constants';
import { reminderStatusSchema } from './reminder-status.dto';

export const updateLeadReminderSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(LEAD_REMINDER_TITLE_MAX_LENGTH)
      .optional(),
    text: z
      .string()
      .trim()
      .max(LEAD_REMINDER_TEXT_MAX_LENGTH)
      .nullable()
      .optional(),
    triggerAt: z.coerce.date().optional(),
    status: reminderStatusSchema.optional(),
  })
  .strict();

export type UpdateLeadReminderDto = z.infer<typeof updateLeadReminderSchema>;
