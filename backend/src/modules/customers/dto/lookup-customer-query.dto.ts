import { z } from 'zod';

export const lookupCustomerQuerySchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type LookupCustomerQueryDto = z.infer<typeof lookupCustomerQuerySchema>;
