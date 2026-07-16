import { z } from 'zod';
import {
  PLAN_LIST_DEFAULT_PAGE,
  PLAN_LIST_DEFAULT_PAGE_SIZE,
  PLAN_LIST_MAX_PAGE_SIZE,
  PLAN_SEARCH_MAX_LENGTH,
} from '../plans.constants';

export const listPlansQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(PLAN_SEARCH_MAX_LENGTH).optional(),
    page: z.coerce.number().int().min(1).default(PLAN_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(PLAN_LIST_MAX_PAGE_SIZE)
      .default(PLAN_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListPlansQueryDto = z.infer<typeof listPlansQuerySchema>;
