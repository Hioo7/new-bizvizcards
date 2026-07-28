import { z } from 'zod';
import {
  CUSTOMER_PHONE_DIAL_CODE_MAX_LENGTH,
  CUSTOMER_PHONE_NUMBER_MAX_LENGTH,
} from '../customers.constants';

export const updateCustomerPhoneSchema = z
  .object({
    phoneCountryDialCode: z
      .string()
      .trim()
      .max(CUSTOMER_PHONE_DIAL_CODE_MAX_LENGTH)
      .nullable()
      .optional(),
    phoneNumber: z
      .string()
      .trim()
      .max(CUSTOMER_PHONE_NUMBER_MAX_LENGTH)
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.phoneCountryDialCode !== undefined || v.phoneNumber !== undefined,
    { message: 'At least one field must be provided' },
  )
  .refine(
    (v) => {
      const hasDialCode =
        v.phoneCountryDialCode !== null && v.phoneCountryDialCode !== undefined;
      const hasNumber =
        v.phoneNumber !== null && v.phoneNumber !== undefined;
      // Both must be present together, or both must be absent/null
      if (hasDialCode !== hasNumber) return false;
      return true;
    },
    { message: 'phoneCountryDialCode and phoneNumber must be provided together' },
  );

export type UpdateCustomerPhoneDto = z.infer<typeof updateCustomerPhoneSchema>;
