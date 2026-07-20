import { z } from 'zod';
import {
  MigrationDomain,
  MigrationRecordStatus,
} from '../../../generated/prisma/client';
import {
  MIGRATION_LIST_DEFAULT_PAGE,
  MIGRATION_LIST_DEFAULT_PAGE_SIZE,
  MIGRATION_LIST_MAX_PAGE_SIZE,
} from '../migration.constants';

export const listMigrationRecordsQuerySchema = z
  .object({
    domain: z.enum(MigrationDomain).optional(),
    status: z.enum(MigrationRecordStatus).optional(),
    // Case-insensitive substring match against MigrationRecord.reason, for
    // the report modal's rejection-reason drill-down/filter.
    reason: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().min(1).default(MIGRATION_LIST_DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MIGRATION_LIST_MAX_PAGE_SIZE)
      .default(MIGRATION_LIST_DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListMigrationRecordsQueryDto = z.infer<
  typeof listMigrationRecordsQuerySchema
>;
