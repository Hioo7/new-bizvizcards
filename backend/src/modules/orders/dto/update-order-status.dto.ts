import { z } from 'zod';
import { OrderStatus } from '../../../generated/prisma/client';

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(OrderStatus),
  })
  .strict();

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
