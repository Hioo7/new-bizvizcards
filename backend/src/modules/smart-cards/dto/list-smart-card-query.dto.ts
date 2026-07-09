import { z } from 'zod';
import {
  SMART_CARD_LIST_DEFAULT_PAGE,
  SMART_CARD_LIST_DEFAULT_PAGE_SIZE,
  SMART_CARD_LIST_MAX_PAGE_SIZE,
} from '../smart-cards.constants';

export const listSmartCardQuerySchema = z
  .object({
    customerId: z.uuid().optional(),
    page: z.coerce.number().int().min(1).default(SMART_CARD_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(SMART_CARD_LIST_MAX_PAGE_SIZE)
      .default(SMART_CARD_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListSmartCardQueryDto = z.infer<typeof listSmartCardQuerySchema>;
