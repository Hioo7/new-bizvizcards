import { z } from 'zod';
import {
  PRODUCT_PRICE_MAX,
  PRODUCT_VARIANT_NAME_MAX_LENGTH,
  PRODUCT_VARIANT_SKU_MAX_LENGTH,
} from '../products.constants';

export const updateProductVariantSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(PRODUCT_VARIANT_NAME_MAX_LENGTH)
      .optional(),
    sku: z
      .string()
      .trim()
      .min(1)
      .max(PRODUCT_VARIANT_SKU_MAX_LENGTH)
      .optional(),
    price: z.number().min(0).max(PRODUCT_PRICE_MAX).optional(),
  })
  .strict();

export type UpdateProductVariantDto = z.infer<
  typeof updateProductVariantSchema
>;
