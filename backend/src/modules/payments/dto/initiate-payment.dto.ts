import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderId: z.string().uuid(),
});

export type InitiatePaymentDto = z.infer<typeof initiatePaymentSchema>;
