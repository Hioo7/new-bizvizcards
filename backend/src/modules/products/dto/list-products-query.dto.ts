import { z } from 'zod';
import { booleanQueryParamSchema } from '../../../common/validators/boolean-query-param.validator';
import { ProductType } from '../../../generated/prisma/client';
import {
  PRODUCT_LIST_DEFAULT_PAGE,
  PRODUCT_LIST_DEFAULT_PAGE_SIZE,
  PRODUCT_LIST_MAX_PAGE_SIZE,
} from '../products.constants';

export const listProductsQuerySchema = z
  .object({
    productType: z.enum(ProductType).optional(),
    isActive: booleanQueryParamSchema.optional(),
    page: z.coerce.number().int().min(1).default(PRODUCT_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(PRODUCT_LIST_MAX_PAGE_SIZE)
      .default(PRODUCT_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListProductsQueryDto = z.infer<typeof listProductsQuerySchema>;
