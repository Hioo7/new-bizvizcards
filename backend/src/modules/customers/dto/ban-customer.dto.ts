import { z } from 'zod';
import { CUSTOMER_BAN_REASON_MAX_LENGTH } from '../customers.constants';

export const banCustomerSchema = z
  .object({
    banReason: z
      .string()
      .trim()
      .min(1)
      .max(CUSTOMER_BAN_REASON_MAX_LENGTH)
      .optional(),
  })
  .strict();

export type BanCustomerDto = z.infer<typeof banCustomerSchema>;
