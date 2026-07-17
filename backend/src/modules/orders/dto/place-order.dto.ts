import { z } from 'zod';

export const placeOrderSchema = z
  .object({
    addressId: z.uuid(),
  })
  .strict();

export type PlaceOrderDto = z.infer<typeof placeOrderSchema>;
