import { z } from 'zod';
import {
  STAFF_ASSIGNABLE_ROLES,
  STAFF_LIST_DEFAULT_PAGE,
  STAFF_LIST_DEFAULT_PAGE_SIZE,
  STAFF_LIST_MAX_PAGE_SIZE,
  STAFF_SEARCH_MAX_LENGTH,
} from '../staff.constants';

export const listStaffQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(STAFF_SEARCH_MAX_LENGTH).optional(),
    role: z.enum(STAFF_ASSIGNABLE_ROLES).optional(),
    page: z.coerce.number().int().min(1).default(STAFF_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(STAFF_LIST_MAX_PAGE_SIZE)
      .default(STAFF_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListStaffQueryDto = z.infer<typeof listStaffQuerySchema>;
