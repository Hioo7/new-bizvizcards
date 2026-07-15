import { z } from 'zod';
import {
  ORGANISATION_LIST_DEFAULT_PAGE,
  ORGANISATION_LIST_DEFAULT_PAGE_SIZE,
  ORGANISATION_LIST_MAX_PAGE_SIZE,
  ORGANISATION_SEARCH_MAX_LENGTH,
} from '../organisations.constants';

export const listOrganisationsQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1)
      .max(ORGANISATION_SEARCH_MAX_LENGTH)
      .optional(),
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
