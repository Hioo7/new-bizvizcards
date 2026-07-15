import { z } from 'zod';
import {
  CUSTOMER_NAME_MAX_LENGTH,
  CUSTOMER_PASSWORD_MAX_LENGTH,
  CUSTOMER_PASSWORD_MIN_LENGTH,
} from '../customers.constants';

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(CUSTOMER_NAME_MAX_LENGTH),
    email: z.email(),
    password: z
      .string()
      .min(CUSTOMER_PASSWORD_MIN_LENGTH)
      .max(CUSTOMER_PASSWORD_MAX_LENGTH),
  })
  .strict();

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
