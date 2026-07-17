import { z } from 'zod';
import { isExactlyOneDefined } from '../../../common/validators/exactly-one-of.validator';
import { PRODUCT_UNIT_PRINT_BATCH_MAX_QUANTITY } from '../products.constants';

export const createPrintBatchSchema = z
  .object({
    productId: z.uuid().optional(),
    variantId: z.uuid().optional(),
    quantity: z
      .number()
      .int()
      .min(1)
      .max(PRODUCT_UNIT_PRINT_BATCH_MAX_QUANTITY),
  })
  .strict()
  .refine((value) => isExactlyOneDefined(value.productId, value.variantId), {
    message: 'Exactly one of productId or variantId must be provided',
    path: ['productId'],
  });

export type CreatePrintBatchDto = z.infer<typeof createPrintBatchSchema>;
