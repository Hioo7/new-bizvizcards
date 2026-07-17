import { z } from 'zod';
import { CART_ITEM_MAX_QUANTITY } from '../cart.constants';

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(1).max(CART_ITEM_MAX_QUANTITY),
  })
  .strict();

export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
