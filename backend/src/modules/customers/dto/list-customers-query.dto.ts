import { z } from 'zod';
import {
  CUSTOMER_LIST_DEFAULT_PAGE,
  CUSTOMER_LIST_DEFAULT_PAGE_SIZE,
  CUSTOMER_LIST_MAX_PAGE_SIZE,
  CUSTOMER_SEARCH_MAX_LENGTH,
} from '../customers.constants';

export const listCustomersQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(CUSTOMER_SEARCH_MAX_LENGTH).optional(),
    page: z.coerce.number().int().min(1).default(CUSTOMER_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(CUSTOMER_LIST_MAX_PAGE_SIZE)
      .default(CUSTOMER_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListCustomersQueryDto = z.infer<typeof listCustomersQuerySchema>;
