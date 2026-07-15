import { z } from 'zod';
import { CUSTOMER_NAME_MAX_LENGTH } from '../customers.constants';

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(CUSTOMER_NAME_MAX_LENGTH).optional(),
    email: z.email().optional(),
  })
  .strict()
  .refine((v) => v.name !== undefined || v.email !== undefined, {
    message: 'At least one of name or email must be provided',
  });

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
