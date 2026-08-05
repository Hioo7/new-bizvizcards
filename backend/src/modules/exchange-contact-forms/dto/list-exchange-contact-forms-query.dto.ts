import { z } from 'zod';

export const listExchangeContactFormsQuerySchema = z
  .object({
    customerId: z.uuid(),
  })
  .strict();

export type ListExchangeContactFormsQueryDto = z.infer<
  typeof listExchangeContactFormsQuerySchema
>;
