import { z } from 'zod';
import {
  REMINDER_DUE_WINDOW_DEFAULT_MINUTES,
  REMINDER_DUE_WINDOW_MAX_MINUTES,
} from '../leads.constants';

export const dueRemindersQuerySchema = z
  .object({
    withinMinutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(REMINDER_DUE_WINDOW_MAX_MINUTES)
      .default(REMINDER_DUE_WINDOW_DEFAULT_MINUTES),
  })
  .strict();

export type DueRemindersQueryDto = z.infer<typeof dueRemindersQuerySchema>;
