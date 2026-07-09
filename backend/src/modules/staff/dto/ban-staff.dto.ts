import { z } from 'zod';
import { STAFF_BAN_REASON_MAX_LENGTH } from '../staff.constants';

export const banStaffSchema = z
  .object({
    banReason: z
      .string()
      .trim()
      .min(1)
      .max(STAFF_BAN_REASON_MAX_LENGTH)
      .optional(),
  })
  .strict();

export type BanStaffDto = z.infer<typeof banStaffSchema>;
