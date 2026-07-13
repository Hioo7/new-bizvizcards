import { z } from 'zod';
import {
  ECARD_PHONE_DIAL_CODE_MAX_LENGTH,
  ECARD_PHONE_NUMBER_DIGITS_REGEX,
  ECARD_PHONE_NUMBER_MAX_DIGITS,
  ECARD_PHONE_NUMBER_MIN_DIGITS,
} from '../../ecards.constants';

// Both fields are required — unlike Hero's optional phone, this component's
// sole purpose is the phone number the "Connect on WhatsApp" link is built
// from, so an empty one would make the component meaningless.
export const ecardWhatsAppComponentSchema = z
  .object({
    type: z.literal('WHATSAPP'),
    phoneCountryDialCode: z
      .string()
      .trim()
      .min(1)
      .max(ECARD_PHONE_DIAL_CODE_MAX_LENGTH),
    phoneNumber: z
      .string()
      .trim()
      .regex(ECARD_PHONE_NUMBER_DIGITS_REGEX)
      .min(ECARD_PHONE_NUMBER_MIN_DIGITS)
      .max(ECARD_PHONE_NUMBER_MAX_DIGITS),
  })
  .strict();

export type EcardWhatsAppComponentDto = z.infer<
  typeof ecardWhatsAppComponentSchema
>;
