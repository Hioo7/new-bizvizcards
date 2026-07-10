import { z } from 'zod';
import {
  LEAD_EMAIL_MAX_LENGTH,
  LEAD_EMAIL_REGEX,
  LEAD_LOCATION_LATITUDE_MAX,
  LEAD_LOCATION_LATITUDE_MIN,
  LEAD_LOCATION_LONGITUDE_MAX,
  LEAD_LOCATION_LONGITUDE_MIN,
  LEAD_NAME_MAX_LENGTH,
  LEAD_NOTE_MAX_LENGTH,
  LEAD_PHONE_DIAL_CODE_MAX_LENGTH,
  LEAD_PHONE_NUMBER_DIGITS_REGEX,
  LEAD_PHONE_NUMBER_MAX_DIGITS,
  LEAD_PHONE_NUMBER_MIN_DIGITS,
  isPairedOrBothAbsent,
} from '../leads.constants';

export const exchangeContactSchema = z
  .object({
    name: z.string().trim().min(1).max(LEAD_NAME_MAX_LENGTH),
    email: z
      .string()
      .trim()
      .max(LEAD_EMAIL_MAX_LENGTH)
      .regex(LEAD_EMAIL_REGEX)
      .optional(),
    countryDialCode: z
      .string()
      .trim()
      .min(1)
      .max(LEAD_PHONE_DIAL_CODE_MAX_LENGTH),
    phoneNumber: z
      .string()
      .trim()
      .regex(LEAD_PHONE_NUMBER_DIGITS_REGEX)
      .min(LEAD_PHONE_NUMBER_MIN_DIGITS)
      .max(LEAD_PHONE_NUMBER_MAX_DIGITS),
    note: z.string().trim().max(LEAD_NOTE_MAX_LENGTH).optional(),
    locationLatitude: z
      .number()
      .min(LEAD_LOCATION_LATITUDE_MIN)
      .max(LEAD_LOCATION_LATITUDE_MAX)
      .optional(),
    locationLongitude: z
      .number()
      .min(LEAD_LOCATION_LONGITUDE_MIN)
      .max(LEAD_LOCATION_LONGITUDE_MAX)
      .optional(),
  })
  .strict()
  .refine(
    (value) =>
      isPairedOrBothAbsent(value.locationLatitude, value.locationLongitude),
    {
      message:
        'locationLatitude and locationLongitude must be provided together',
      path: ['locationLongitude'],
    },
  );

export type ExchangeContactDto = z.infer<typeof exchangeContactSchema>;
