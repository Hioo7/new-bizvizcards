import { z } from 'zod';
import { OrderStatus } from '../../../generated/prisma/client';
import {
  ORDER_LIST_DEFAULT_PAGE,
  ORDER_LIST_DEFAULT_PAGE_SIZE,
  ORDER_LIST_MAX_PAGE_SIZE,
} from '../orders.constants';

export const listOrdersQuerySchema = z
  .object({
    status: z.enum(OrderStatus).optional(),
    customerId: z.uuid().optional(),
    placedFrom: z.coerce.date().optional(),
    placedTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(ORDER_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(ORDER_LIST_MAX_PAGE_SIZE)
      .default(ORDER_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListOrdersQueryDto = z.infer<typeof listOrdersQuerySchema>;
