import { z } from 'zod';

export const bulkMessagePlaceholdersQuerySchema = z
  .object({
    formId: z.uuid().optional(),
  })
  .strict();

export type BulkMessagePlaceholdersQueryDto = z.infer<
  typeof bulkMessagePlaceholdersQuerySchema
>;
