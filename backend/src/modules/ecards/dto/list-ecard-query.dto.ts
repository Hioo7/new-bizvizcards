import { z } from 'zod';
import {
  ECARD_LIST_DEFAULT_PAGE,
  ECARD_LIST_DEFAULT_PAGE_SIZE,
  ECARD_LIST_MAX_PAGE_SIZE,
} from '../ecards.constants';

export const listEcardQuerySchema = z
  .object({
    customerId: z.uuid().optional(),
    page: z.coerce.number().int().min(1).default(ECARD_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(ECARD_LIST_MAX_PAGE_SIZE)
      .default(ECARD_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListEcardQueryDto = z.infer<typeof listEcardQuerySchema>;
