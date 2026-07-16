import { z } from 'zod';
import {
  EVENT_LIST_DEFAULT_PAGE,
  EVENT_LIST_DEFAULT_PAGE_SIZE,
  EVENT_LIST_MAX_PAGE_SIZE,
  EVENT_SEARCH_MAX_LENGTH,
} from '../business-events.constants';

export const listEventsQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(EVENT_SEARCH_MAX_LENGTH).optional(),
    page: z.coerce.number().int().min(1).default(EVENT_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(EVENT_LIST_MAX_PAGE_SIZE)
      .default(EVENT_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListEventsQueryDto = z.infer<typeof listEventsQuerySchema>;
