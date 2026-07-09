import { z } from 'zod';
import {
  STAFF_ASSIGNABLE_ROLES,
  STAFF_NAME_MAX_LENGTH,
} from '../staff.constants';

export const createStaffSchema = z
  .object({
    email: z.email(),
    name: z.string().trim().min(1).max(STAFF_NAME_MAX_LENGTH),
    role: z.enum(STAFF_ASSIGNABLE_ROLES),
  })
  .strict();

export type CreateStaffDto = z.infer<typeof createStaffSchema>;
