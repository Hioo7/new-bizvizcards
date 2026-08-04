import { z } from "zod";
import {
  ECARD_PHONE_DIAL_CODE_MAX_LENGTH,
  ECARD_PHONE_NUMBER_DIGITS_REGEX,
  ECARD_PHONE_NUMBER_MAX_DIGITS,
  ECARD_PHONE_NUMBER_MIN_DIGITS,
  ECARD_REVIEW_LINK_URL_MAX_LENGTH,
  ECARD_TEXT_SHORT_MAX_LENGTH,
  normalizeEcardVideoUrl,
  type ReviewLinkSheetValues,
  type VideoSheetValues,
  type WhatsAppSheetValues,
} from "@features/ecards";

// A template WhatsApp/Video component may define only one of its fields —
// the other falls back to the customer's own value at merge time (see the
// backend merge util) — so unlike the e-card's own sheets, every field here
// is valid when left blank rather than required.

export const organisationEcardTemplateWhatsappSheetSchema: z.ZodType<
  WhatsAppSheetValues,
  WhatsAppSheetValues
> = z.object({
  phoneCountryDialCode: z.string().trim().max(ECARD_PHONE_DIAL_CODE_MAX_LENGTH),
  phoneNumber: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (ECARD_PHONE_NUMBER_DIGITS_REGEX.test(value) &&
          value.length >= ECARD_PHONE_NUMBER_MIN_DIGITS &&
          value.length <= ECARD_PHONE_NUMBER_MAX_DIGITS),
      `Enter ${ECARD_PHONE_NUMBER_MIN_DIGITS}-${ECARD_PHONE_NUMBER_MAX_DIGITS} digits`,
    ),
});

export const organisationEcardTemplateVideoSheetSchema: z.ZodType<
  VideoSheetValues,
  VideoSheetValues
> = z.object({
  title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
  videoUrl: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return value;
      const normalized = normalizeEcardVideoUrl(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid YouTube or Vimeo link",
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

export const organisationEcardTemplateReviewLinkSheetSchema: z.ZodType<
  ReviewLinkSheetValues,
  ReviewLinkSheetValues
> = z.object({
  url: z
    .string()
    .trim()
    .max(ECARD_REVIEW_LINK_URL_MAX_LENGTH)
    .refine((value) => value === "" || /^https?:\/\//.test(value), "Enter a valid URL"),
});
