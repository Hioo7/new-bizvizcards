import { z } from 'zod';
import { EmailSignatureSocialPlatform } from '../../../generated/prisma/client';
import {
  EMAIL_SIGNATURE_SOCIAL_LINK_LABEL_MAX_LENGTH,
  EMAIL_SIGNATURE_URL_MAX_LENGTH,
  EMAIL_SIGNATURE_WHATSAPP_PHONE_DIGITS_REGEX,
  EMAIL_SIGNATURE_WHATSAPP_PHONE_MAX_DIGITS,
  EMAIL_SIGNATURE_WHATSAPP_PHONE_MIN_DIGITS,
} from '../email-signatures.constants';

const urlSchema = z.url().max(EMAIL_SIGNATURE_URL_MAX_LENGTH);
const labelSchema = z
  .string()
  .trim()
  .min(1)
  .max(EMAIL_SIGNATURE_SOCIAL_LINK_LABEL_MAX_LENGTH);
// Digits only, including country code — no "+"/spaces/dashes — same shape
// as the signature's own top-level `phone` field.
const whatsAppPhoneNumberSchema = z
  .string()
  .trim()
  .regex(EMAIL_SIGNATURE_WHATSAPP_PHONE_DIGITS_REGEX)
  .min(EMAIL_SIGNATURE_WHATSAPP_PHONE_MIN_DIGITS)
  .max(EMAIL_SIGNATURE_WHATSAPP_PHONE_MAX_DIGITS);

// Discriminated on platform: `label` only exists as a field on the CUSTOM
// variant — structurally prevents the ambiguity of "does label apply here"
// that a single optional field on a flat object would leave implicit.
// Written out explicitly (not generated via a loop over the enum) since
// zod's discriminatedUnion needs a genuine non-empty tuple type, which a
// runtime-built array can't statically provide.
export const emailSignatureSocialLinkSchema = z.discriminatedUnion('platform', [
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.LINKEDIN),
      url: urlSchema,
    })
    .strict(),
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.TWITTER),
      url: urlSchema,
    })
    .strict(),
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.FACEBOOK),
      url: urlSchema,
    })
    .strict(),
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.INSTAGRAM),
      url: urlSchema,
    })
    .strict(),
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.GITHUB),
      url: urlSchema,
    })
    .strict(),
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.YOUTUBE),
      url: urlSchema,
    })
    .strict(),
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.TIKTOK),
      url: urlSchema,
    })
    .strict(),
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.WEBSITE),
      url: urlSchema,
    })
    .strict(),
  // Distinct shape (phoneNumber, not url) — the click-to-chat wa.me link is
  // generated from this at the service layer (see
  // EmailSignaturesService.normalizeSocialLink), never entered directly.
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.WHATSAPP),
      phoneNumber: whatsAppPhoneNumberSchema,
    })
    .strict(),
  z
    .object({
      platform: z.literal(EmailSignatureSocialPlatform.CUSTOM),
      url: urlSchema,
      label: labelSchema,
    })
    .strict(),
]);

export type EmailSignatureSocialLinkDto = z.infer<
  typeof emailSignatureSocialLinkSchema
>;
