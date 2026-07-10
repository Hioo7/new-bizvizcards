import { z } from 'zod';
import { ReminderStatus } from '../../../generated/prisma/client';

export const reminderStatusSchema = z.enum(ReminderStatus);
export type ReminderStatusDto = z.infer<typeof reminderStatusSchema>;
