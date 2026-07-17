import { z } from 'zod';
import {
  ADDRESS_CITY_MAX_LENGTH,
  ADDRESS_CONTACT_NAME_MAX_LENGTH,
  ADDRESS_COUNTRY_MAX_LENGTH,
  ADDRESS_LABEL_MAX_LENGTH,
  ADDRESS_LATITUDE_MAX,
  ADDRESS_LATITUDE_MIN,
  ADDRESS_LINE_MAX_LENGTH,
  ADDRESS_LONGITUDE_MAX,
  ADDRESS_LONGITUDE_MIN,
  ADDRESS_PHONE_DIAL_CODE_MAX_LENGTH,
  ADDRESS_PHONE_NUMBER_DIGITS_REGEX,
  ADDRESS_PHONE_NUMBER_MAX_DIGITS,
  ADDRESS_PHONE_NUMBER_MIN_DIGITS,
  ADDRESS_PINCODE_MAX_LENGTH,
  ADDRESS_STATE_MAX_LENGTH,
} from '../addresses.constants';

export const createAddressSchema = z
  .object({
    label: z.string().trim().min(1).max(ADDRESS_LABEL_MAX_LENGTH),
    contactName: z.string().trim().min(1).max(ADDRESS_CONTACT_NAME_MAX_LENGTH),
    contactPhoneCountryDialCode: z
      .string()
      .trim()
      .min(1)
      .max(ADDRESS_PHONE_DIAL_CODE_MAX_LENGTH),
    contactPhoneNumber: z
      .string()
      .trim()
      .regex(ADDRESS_PHONE_NUMBER_DIGITS_REGEX)
      .min(ADDRESS_PHONE_NUMBER_MIN_DIGITS)
      .max(ADDRESS_PHONE_NUMBER_MAX_DIGITS),
    line1: z.string().trim().min(1).max(ADDRESS_LINE_MAX_LENGTH),
    line2: z.string().trim().max(ADDRESS_LINE_MAX_LENGTH).optional(),
    city: z.string().trim().min(1).max(ADDRESS_CITY_MAX_LENGTH),
    state: z.string().trim().min(1).max(ADDRESS_STATE_MAX_LENGTH),
    country: z.string().trim().min(1).max(ADDRESS_COUNTRY_MAX_LENGTH),
    pincode: z.string().trim().min(1).max(ADDRESS_PINCODE_MAX_LENGTH),
    latitude: z
      .number()
      .min(ADDRESS_LATITUDE_MIN)
      .max(ADDRESS_LATITUDE_MAX)
      .optional(),
    longitude: z
      .number()
      .min(ADDRESS_LONGITUDE_MIN)
      .max(ADDRESS_LONGITUDE_MAX)
      .optional(),
  })
  .strict();

export type CreateAddressDto = z.infer<typeof createAddressSchema>;
