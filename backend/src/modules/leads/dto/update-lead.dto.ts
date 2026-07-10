import { z } from 'zod';
import {
  LEAD_COMPANY_MAX_LENGTH,
  LEAD_EMAIL_MAX_LENGTH,
  LEAD_EMAIL_REGEX,
  LEAD_LOCATION_LATITUDE_MAX,
  LEAD_LOCATION_LATITUDE_MIN,
  LEAD_LOCATION_LONGITUDE_MAX,
  LEAD_LOCATION_LONGITUDE_MIN,
  LEAD_LOCATION_MAX_LENGTH,
  LEAD_NAME_MAX_LENGTH,
  LEAD_NOTE_MAX_LENGTH,
  LEAD_PHONE_DIAL_CODE_MAX_LENGTH,
  LEAD_PHONE_NUMBER_DIGITS_REGEX,
  LEAD_PHONE_NUMBER_MAX_DIGITS,
  LEAD_PHONE_NUMBER_MIN_DIGITS,
  LEAD_PROFESSION_MAX_LENGTH,
} from '../leads.constants';
import { opportunityStageSchema } from './opportunity-stage.dto';

// Every field is independently optional/nullable: omit to leave unchanged, pass null to clear.
// Unlike create, a partial update legitimately touches one side of a "paired" field (e.g. just
// phoneNumber) while the other keeps its previously stored value, so no cross-field pairing
// refinement is applied here.
export const updateLeadSchema = z
  .object({
    name: z.string().trim().min(1).max(LEAD_NAME_MAX_LENGTH).optional(),
    email: z
      .string()
      .trim()
      .max(LEAD_EMAIL_MAX_LENGTH)
      .regex(LEAD_EMAIL_REGEX)
      .nullable()
      .optional(),
    countryDialCode: z
      .string()
      .trim()
      .min(1)
      .max(LEAD_PHONE_DIAL_CODE_MAX_LENGTH)
      .nullable()
      .optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(LEAD_PHONE_NUMBER_DIGITS_REGEX)
      .min(LEAD_PHONE_NUMBER_MIN_DIGITS)
      .max(LEAD_PHONE_NUMBER_MAX_DIGITS)
      .nullable()
      .optional(),
    note: z.string().trim().max(LEAD_NOTE_MAX_LENGTH).nullable().optional(),
    company: z
      .string()
      .trim()
      .max(LEAD_COMPANY_MAX_LENGTH)
      .nullable()
      .optional(),
    profession: z
      .string()
      .trim()
      .max(LEAD_PROFESSION_MAX_LENGTH)
      .nullable()
      .optional(),
    location: z
      .string()
      .trim()
      .max(LEAD_LOCATION_MAX_LENGTH)
      .nullable()
      .optional(),
    locationLatitude: z
      .number()
      .min(LEAD_LOCATION_LATITUDE_MIN)
      .max(LEAD_LOCATION_LATITUDE_MAX)
      .nullable()
      .optional(),
    locationLongitude: z
      .number()
      .min(LEAD_LOCATION_LONGITUDE_MIN)
      .max(LEAD_LOCATION_LONGITUDE_MAX)
      .nullable()
      .optional(),
    folderId: z.string().uuid().nullable().optional(),
    stage: opportunityStageSchema.nullable().optional(),
  })
  .strict();

export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;
