import { z } from 'zod';
import { PRODUCT_UNIT_GENERATE_MAX_QUANTITY } from '../products.constants';

export const generateProductUnitsSchema = z
  .object({
    quantity: z.number().int().min(1).max(PRODUCT_UNIT_GENERATE_MAX_QUANTITY),
  })
  .strict();

export type GenerateProductUnitsDto = z.infer<
  typeof generateProductUnitsSchema
>;
