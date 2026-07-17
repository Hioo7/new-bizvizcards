import { z } from 'zod';
import {
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_PRICE_MAX,
} from '../products.constants';

// productType is deliberately not updatable — standalone vs. variant-based is
// a structural decision made at creation time (see Product.productType).
// price is only settable for a STANDALONE product — ProductsService rejects
// it for VARIANT_BASED products.
export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(PRODUCT_NAME_MAX_LENGTH).optional(),
    description: z
      .string()
      .trim()
      .max(PRODUCT_DESCRIPTION_MAX_LENGTH)
      .optional(),
    isActive: z.boolean().optional(),
    price: z.number().min(0).max(PRODUCT_PRICE_MAX).optional(),
  })
  .strict();

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
