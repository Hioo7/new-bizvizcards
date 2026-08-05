import { z } from 'zod';

export const emailSignaturePolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxEmailSignatures: z.number().int().min(0),
  })
  .strict();

export type EmailSignaturePolicyDto = z.infer<
  typeof emailSignaturePolicySchema
>;
