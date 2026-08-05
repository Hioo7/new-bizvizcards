import { z } from 'zod';
import {
  EMAIL_SIGNATURE_PHONE_NUMBER_DIGITS_REGEX,
  EMAIL_SIGNATURE_PHONE_NUMBER_MAX_DIGITS,
  EMAIL_SIGNATURE_PHONE_NUMBER_MIN_DIGITS,
  EMAIL_SIGNATURE_TEXT_MEDIUM_MAX_LENGTH,
  EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH,
  EMAIL_SIGNATURE_URL_MAX_LENGTH,
  EMAIL_SIGNATURE_MAX_SOCIAL_LINKS,
} from '../email-signatures.constants';
import { emailSignatureSocialLinkSchema } from './email-signature-social-link.dto';
import { emailSignatureTemplateKeySchema } from './email-signature-template-key.dto';

// Same content shape as create/update, minus the image-slot upload objects —
// preview is a non-persisting render, so it takes plain, already-resolved
// image URLs (the signature's existing images, or a freshly-picked file's
// local blob URL rendered client-side for that one slot) instead of files.
export const previewEmailSignatureSchema = z
  .object({
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
    profileImageUrl: z.url().max(EMAIL_SIGNATURE_URL_MAX_LENGTH).optional(),
    companyLogoUrl: z.url().max(EMAIL_SIGNATURE_URL_MAX_LENGTH).optional(),
    bannerImageUrl: z.url().max(EMAIL_SIGNATURE_URL_MAX_LENGTH).optional(),
    socialLinks: z
      .array(emailSignatureSocialLinkSchema)
      .max(EMAIL_SIGNATURE_MAX_SOCIAL_LINKS)
      .default([]),
  })
  .strict();

export type PreviewEmailSignatureDto = z.infer<
  typeof previewEmailSignatureSchema
>;
