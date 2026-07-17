import { z } from 'zod';
import { booleanQueryParamSchema } from '../../../common/validators/boolean-query-param.validator';
import { isExactlyOneDefined } from '../../../common/validators/exactly-one-of.validator';
import {
  PRODUCT_UNIT_LIST_DEFAULT_PAGE,
  PRODUCT_UNIT_LIST_DEFAULT_PAGE_SIZE,
  PRODUCT_UNIT_LIST_MAX_PAGE_SIZE,
} from '../products.constants';

export const listProductUnitsQuerySchema = z
  .object({
    productId: z.uuid().optional(),
    variantId: z.uuid().optional(),
    printed: booleanQueryParamSchema.optional(),
    linked: booleanQueryParamSchema.optional(),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(PRODUCT_UNIT_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(PRODUCT_UNIT_LIST_MAX_PAGE_SIZE)
      .default(PRODUCT_UNIT_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict()
  .refine((value) => isExactlyOneDefined(value.productId, value.variantId), {
    message: 'Exactly one of productId or variantId must be provided',
    path: ['productId'],
  });

export type ListProductUnitsQueryDto = z.infer<
  typeof listProductUnitsQuerySchema
>;
