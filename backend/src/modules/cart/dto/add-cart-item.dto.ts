import { z } from 'zod';
import { isExactlyOneDefined } from '../../../common/validators/exactly-one-of.validator';
import { CART_ITEM_MAX_QUANTITY } from '../cart.constants';

// Exactly one of productId/variantId — matching the referenced Product's
// productType (service-enforced), same pattern as ProductUnit.
export const addCartItemSchema = z
  .object({
    productId: z.uuid().optional(),
    variantId: z.uuid().optional(),
    quantity: z.number().int().min(1).max(CART_ITEM_MAX_QUANTITY).default(1),
  })
  .strict()
  .refine((value) => isExactlyOneDefined(value.productId, value.variantId), {
    message: 'Exactly one of productId or variantId must be provided',
    path: ['productId'],
  });

export type AddCartItemDto = z.infer<typeof addCartItemSchema>;
