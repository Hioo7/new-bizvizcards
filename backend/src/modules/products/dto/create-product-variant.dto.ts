import { z } from 'zod';
import {
  PRODUCT_PRICE_MAX,
  PRODUCT_VARIANT_NAME_MAX_LENGTH,
  PRODUCT_VARIANT_SKU_MAX_LENGTH,
} from '../products.constants';

export const createProductVariantSchema = z
  .object({
    name: z.string().trim().min(1).max(PRODUCT_VARIANT_NAME_MAX_LENGTH),
    sku: z.string().trim().min(1).max(PRODUCT_VARIANT_SKU_MAX_LENGTH),
    price: z.number().min(0).max(PRODUCT_PRICE_MAX),
  })
  .strict();

export type CreateProductVariantDto = z.infer<
  typeof createProductVariantSchema
>;
