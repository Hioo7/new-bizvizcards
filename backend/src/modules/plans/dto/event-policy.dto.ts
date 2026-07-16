import { z } from 'zod';

export const eventPolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxEvents: z.number().int().min(0),
    maxGuestsPerEvent: z.number().int().min(0),
  })
  .strict();

export type EventPolicyDto = z.infer<typeof eventPolicySchema>;
