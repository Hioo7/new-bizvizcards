import { z } from 'zod';
import { ProductType } from '../../../generated/prisma/client';
import {
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_PRICE_MAX,
} from '../products.constants';

// price is required for STANDALONE and forbidden for VARIANT_BASED (each
// variant is priced independently instead) — enforced in ProductsService,
// since that rule depends on productType, not expressible cleanly as a
// single zod refine without duplicating the STANDALONE/VARIANT_BASED branch.
export const createProductSchema = z
  .object({
    name: z.string().trim().min(1).max(PRODUCT_NAME_MAX_LENGTH),
    description: z
      .string()
      .trim()
      .max(PRODUCT_DESCRIPTION_MAX_LENGTH)
      .optional(),
    productType: z.enum(ProductType),
    price: z.number().min(0).max(PRODUCT_PRICE_MAX).optional(),
  })
  .strict();

export type CreateProductDto = z.infer<typeof createProductSchema>;
