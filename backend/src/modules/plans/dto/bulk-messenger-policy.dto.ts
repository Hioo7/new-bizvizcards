import { z } from 'zod';

export const bulkMessengerPolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxTemplates: z.number().int().min(0),
  })
  .strict();

export type BulkMessengerPolicyDto = z.infer<typeof bulkMessengerPolicySchema>;
