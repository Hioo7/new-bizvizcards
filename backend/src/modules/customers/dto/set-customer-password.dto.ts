import { z } from 'zod';
import {
  CUSTOMER_PASSWORD_MAX_LENGTH,
  CUSTOMER_PASSWORD_MIN_LENGTH,
} from '../customers.constants';

export const setCustomerPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(CUSTOMER_PASSWORD_MIN_LENGTH)
      .max(CUSTOMER_PASSWORD_MAX_LENGTH),
  })
  .strict();

export type SetCustomerPasswordDto = z.infer<typeof setCustomerPasswordSchema>;
