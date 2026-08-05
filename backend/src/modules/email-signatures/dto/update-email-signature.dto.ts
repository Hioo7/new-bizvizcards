import { z } from 'zod';
import { updateImageSlotSchema } from '../../../common/validators/image-slot.dto';
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

export const updateEmailSignatureSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(EMAIL_SIGNATURE_NAME_MAX_LENGTH)
      .optional(),
    templateKey: emailSignatureTemplateKeySchema.optional(),
    fullName: z
      .string()
      .trim()
      .min(1)
      .max(EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH)
      .optional(),
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
    profileImage: updateImageSlotSchema.optional(),
    companyLogo: updateImageSlotSchema.optional(),
    bannerImage: updateImageSlotSchema.optional(),
    socialLinks: z
      .array(emailSignatureSocialLinkSchema)
      .max(EMAIL_SIGNATURE_MAX_SOCIAL_LINKS)
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateEmailSignatureDto = z.infer<
  typeof updateEmailSignatureSchema
>;
