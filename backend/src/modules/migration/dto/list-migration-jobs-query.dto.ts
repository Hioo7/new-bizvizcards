import { z } from 'zod';
import {
  MIGRATION_LIST_DEFAULT_PAGE,
  MIGRATION_LIST_DEFAULT_PAGE_SIZE,
  MIGRATION_LIST_MAX_PAGE_SIZE,
} from '../migration.constants';

export const listMigrationJobsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(MIGRATION_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MIGRATION_LIST_MAX_PAGE_SIZE)
      .default(MIGRATION_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListMigrationJobsQueryDto = z.infer<
  typeof listMigrationJobsQuerySchema
>;
