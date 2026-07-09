import { z } from 'zod';
import { STAFF_ASSIGNABLE_ROLES } from '../staff.constants';

export const setStaffRoleSchema = z
  .object({
    role: z.enum(STAFF_ASSIGNABLE_ROLES),
  })
  .strict();

export type SetStaffRoleDto = z.infer<typeof setStaffRoleSchema>;
