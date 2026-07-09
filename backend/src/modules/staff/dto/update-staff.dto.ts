import { z } from 'zod';
import { STAFF_NAME_MAX_LENGTH } from '../staff.constants';

export const updateStaffSchema = z
  .object({
    name: z.string().trim().min(1).max(STAFF_NAME_MAX_LENGTH),
  })
  .strict();

export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
