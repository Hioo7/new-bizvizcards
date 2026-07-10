import { z } from 'zod';

export const listLeadsQuerySchema = z
  .object({
    folderId: z.string().uuid().optional(),
  })
  .strict();

export type ListLeadsQueryDto = z.infer<typeof listLeadsQuerySchema>;
