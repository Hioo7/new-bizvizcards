import { z } from 'zod';
import {
  ORGANISATION_LIST_DEFAULT_PAGE,
  ORGANISATION_LIST_DEFAULT_PAGE_SIZE,
  ORGANISATION_LIST_MAX_PAGE_SIZE,
} from '../organisations.constants';

export const listOrganisationsQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(ORGANISATION_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(ORGANISATION_LIST_MAX_PAGE_SIZE)
      .default(ORGANISATION_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListOrganisationsQueryDto = z.infer<
  typeof listOrganisationsQuerySchema
>;
