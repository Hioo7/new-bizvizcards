import { z } from "zod";
import {
  ECARD_ENDPOINT_MAX_LENGTH,
  ECARD_ENDPOINT_MIN_LENGTH,
  ECARD_ENDPOINT_REGEX,
  ECARD_LOCATION_TILE_LABEL_MAX_LENGTH,
  ECARD_MAX_TESTIMONIALS,
  ECARD_PHONE_DIAL_CODE_MAX_LENGTH,
  ECARD_PHONE_NUMBER_DIGITS_REGEX,
  ECARD_PHONE_NUMBER_MAX_DIGITS,
  ECARD_PHONE_NUMBER_MIN_DIGITS,
  ECARD_REVIEW_LINK_URL_MAX_LENGTH,
  ECARD_TESTIMONIAL_NAME_MAX_LENGTH,
  ECARD_TESTIMONIAL_RATING_MAX,
  ECARD_TESTIMONIAL_RATING_MIN,
  ECARD_TESTIMONIAL_TEXT_MAX_LENGTH,
  ECARD_TEXT_LONG_MAX_LENGTH,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from "@features/ecards/config/ecardBuilder.config";
import { normalizeEcardVideoUrl } from "@features/ecards/utils/normalizeVideoUrl";

export const heroSheetSchema = z
  .object({
    endpoint: z
      .string()
      .trim()
      .min(ECARD_ENDPOINT_MIN_LENGTH, "Too short")
      .max(ECARD_ENDPOINT_MAX_LENGTH, "Too long")
      .regex(ECARD_ENDPOINT_REGEX, "Letters, numbers, and hyphens only"),
    name: z.string().trim().min(1, "Required").max(ECARD_TEXT_SHORT_MAX_LENGTH),
    email: z.string().trim().min(1, "Required").email("Enter a valid email"),
    companyName: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
    phoneCountryDialCode: z.string().trim(),
    phoneNumber: z.string().trim(),
  })
  .refine(
    (value) => (value.phoneCountryDialCode === "") === (value.phoneNumber === ""),
    { message: "Enter both the dial code and phone number", path: ["phoneNumber"] },
  )
  .refine(
    (value) =>
      value.phoneNumber === "" ||
      (ECARD_PHONE_NUMBER_DIGITS_REGEX.test(value.phoneNumber) &&
        value.phoneNumber.length >= ECARD_PHONE_NUMBER_MIN_DIGITS &&
        value.phoneNumber.length <= ECARD_PHONE_NUMBER_MAX_DIGITS),
    {
      message: `Enter ${ECARD_PHONE_NUMBER_MIN_DIGITS}-${ECARD_PHONE_NUMBER_MAX_DIGITS} digits`,
      path: ["phoneNumber"],
    },
  );

export const aboutSheetSchema = z.object({
  profession: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
  shortNote: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
  description: z.string().trim().max(ECARD_TEXT_LONG_MAX_LENGTH),
  aboutMe: z.string().trim().max(ECARD_TEXT_LONG_MAX_LENGTH),
});

const urlOrEmpty = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\//.test(value), "Enter a valid URL");

export const socialLinksSheetSchema = z.object({
  website: urlOrEmpty,
  instagram: urlOrEmpty,
  facebook: urlOrEmpty,
  twitter: urlOrEmpty,
  linkedIn: urlOrEmpty,
  youtube: urlOrEmpty,
});

export const videoSheetSchema = z.object({
  title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
  videoUrl: z
    .string()
    .trim()
    .transform((value, ctx) => {
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

// Both fields required (unlike Hero's optional phone) — this component's
// sole purpose is the phone number the WhatsApp link is built from.
export const whatsappSheetSchema = z.object({
  phoneCountryDialCode: z
    .string()
    .trim()
    .min(1, "Required")
    .max(ECARD_PHONE_DIAL_CODE_MAX_LENGTH),
  phoneNumber: z
    .string()
    .trim()
    .regex(ECARD_PHONE_NUMBER_DIGITS_REGEX, "Digits only")
    .min(ECARD_PHONE_NUMBER_MIN_DIGITS, `Enter ${ECARD_PHONE_NUMBER_MIN_DIGITS}-${ECARD_PHONE_NUMBER_MAX_DIGITS} digits`)
    .max(ECARD_PHONE_NUMBER_MAX_DIGITS, `Enter ${ECARD_PHONE_NUMBER_MIN_DIGITS}-${ECARD_PHONE_NUMBER_MAX_DIGITS} digits`),
});

// Only the label is a real form field — latitude/longitude are only ever set
// via the "Capture Location" button (useGeolocation), never typed, so they're
// tracked as plain component state outside react-hook-form (see
// LocationTileEditSheet) rather than forced into this schema's number type.
export const locationTileSheetSchema = z.object({
  label: z.string().trim().min(1, "Required").max(ECARD_LOCATION_TILE_LABEL_MAX_LENGTH),
});

// Required — an empty review link would make the component meaningless.
export const reviewLinkSheetSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Required")
    .max(ECARD_REVIEW_LINK_URL_MAX_LENGTH)
    .refine((value) => /^https?:\/\//.test(value), "Enter a valid URL"),
});

const testimonialEntrySheetSchema = z.object({
  name: z.string().trim().min(1, "Required").max(ECARD_TESTIMONIAL_NAME_MAX_LENGTH),
  rating: z
    .number()
    .int()
    .min(ECARD_TESTIMONIAL_RATING_MIN)
    .max(ECARD_TESTIMONIAL_RATING_MAX),
  text: z.string().trim().min(1, "Required").max(ECARD_TESTIMONIAL_TEXT_MAX_LENGTH),
});

export const testimonialsSheetSchema = z.object({
  entries: z.array(testimonialEntrySheetSchema).max(ECARD_MAX_TESTIMONIALS),
});

export type HeroSheetValues = z.infer<typeof heroSheetSchema>;
export type AboutSheetValues = z.infer<typeof aboutSheetSchema>;
export type SocialLinksSheetValues = z.infer<typeof socialLinksSheetSchema>;
export type VideoSheetValues = z.infer<typeof videoSheetSchema>;
export type WhatsAppSheetValues = z.infer<typeof whatsappSheetSchema>;
export type LocationTileSheetValues = z.infer<typeof locationTileSheetSchema>;
export type ReviewLinkSheetValues = z.infer<typeof reviewLinkSheetSchema>;
export type TestimonialEntrySheetValues = z.infer<typeof testimonialEntrySheetSchema>;
export type TestimonialsSheetValues = z.infer<typeof testimonialsSheetSchema>;
