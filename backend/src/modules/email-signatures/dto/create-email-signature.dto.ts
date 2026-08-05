import { z } from 'zod';
import { createImageSlotSchema } from '../../../common/validators/image-slot.dto';
import {
  EMAIL_SIGNATURE_MAX_SOCIAL_LINKS,
  EMAIL_SIGNATURE_NAME_MAX_LENGTH,
  EMAIL_SIGNATURE_PHONE_NUMBER_DIGITS_REGEX,
  EMAIL_SIGNATURE_PHONE_NUMBER_MAX_DIGITS,
  EMAIL_SIGNATURE_PHONE_NUMBER_MIN_DIGITS,
  EMAIL_SIGNATURE_TEXT_MEDIUM_MAX_LENGTH,
  EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH,
  EMAIL_SIGNATURE_URL_MAX_LENGTH,
} from '../email-signatures.constants';
import { emailSignatureSocialLinkSchema } from './email-signature-social-link.dto';
import { emailSignatureTemplateKeySchema } from './email-signature-template-key.dto';

// One shared content shape for every template — all three templates render
// the same full field set (see the renderer sub-system), so unlike
// SmartCard there is no per-template schema divergence to register.
export const createEmailSignatureSchema = z
  .object({
    name: z.string().trim().min(1).max(EMAIL_SIGNATURE_NAME_MAX_LENGTH),
    templateKey: emailSignatureTemplateKeySchema,
    fullName: z
      .string()
      .trim()
      .min(1)
      .max(EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH),
    jobTitle: z
      .string()
      .trim()
      .max(EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH)
      .optional(),
    company: z
      .string()
      .trim()
      .max(EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH)
      .optional(),
    email: z.email().max(EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH).optional(),
    phone: z
      .string()
      .trim()
      .regex(EMAIL_SIGNATURE_PHONE_NUMBER_DIGITS_REGEX)
      .min(EMAIL_SIGNATURE_PHONE_NUMBER_MIN_DIGITS)
      .max(EMAIL_SIGNATURE_PHONE_NUMBER_MAX_DIGITS)
      .optional(),
    website: z.url().max(EMAIL_SIGNATURE_URL_MAX_LENGTH).optional(),
    address: z
      .string()
      .trim()
      .max(EMAIL_SIGNATURE_TEXT_MEDIUM_MAX_LENGTH)
      .optional(),
    ctaText: z
      .string()
      .trim()
      .max(EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH)
      .optional(),
    ctaUrl: z.url().max(EMAIL_SIGNATURE_URL_MAX_LENGTH).optional(),
    profileImage: createImageSlotSchema.optional(),
    companyLogo: createImageSlotSchema.optional(),
    bannerImage: createImageSlotSchema.optional(),
    socialLinks: z
      .array(emailSignatureSocialLinkSchema)
      .max(EMAIL_SIGNATURE_MAX_SOCIAL_LINKS)
      .default([]),
  })
  .strict();

export type CreateEmailSignatureDto = z.infer<
  typeof createEmailSignatureSchema
>;
