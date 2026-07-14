import { z } from "zod";
import {
  ECARD_ENDPOINT_MAX_LENGTH,
  ECARD_ENDPOINT_MIN_LENGTH,
  ECARD_ENDPOINT_REGEX,
  ECARD_PHONE_DIAL_CODE_MAX_LENGTH,
  ECARD_PHONE_NUMBER_DIGITS_REGEX,
  ECARD_PHONE_NUMBER_MAX_DIGITS,
  ECARD_PHONE_NUMBER_MIN_DIGITS,
  ECARD_TEXT_LONG_MAX_LENGTH,
  ECARD_TEXT_SHORT_MAX_LENGTH,
  ECARD_VIDEO_URL_ALLOWED_HOST_PATTERN,
} from "@features/ecards/config/ecardBuilder.config";

export const heroSheetSchema = z
  .object({
    endpoint: z
      .string()
      .trim()
      .min(ECARD_ENDPOINT_MIN_LENGTH, "Too short")
      .max(ECARD_ENDPOINT_MAX_LENGTH, "Too long")
      .regex(ECARD_ENDPOINT_REGEX, "Lowercase letters, numbers, and hyphens only"),
    name: z.string().trim().min(1, "Required").max(ECARD_TEXT_SHORT_MAX_LENGTH),
    email: z.string().trim().min(1, "Required").email("Enter a valid email"),
    companyName: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
    phoneCountryDialCode: z.string().trim(),
    phoneNumber: z.string().trim(),
    isExchangeContactEnabled: z.boolean(),
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
});

export const videoSheetSchema = z.object({
  title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
  videoUrl: z
    .string()
    .trim()
    .regex(ECARD_VIDEO_URL_ALLOWED_HOST_PATTERN, "Must be a YouTube or Vimeo embed URL"),
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

export type HeroSheetValues = z.infer<typeof heroSheetSchema>;
export type AboutSheetValues = z.infer<typeof aboutSheetSchema>;
export type SocialLinksSheetValues = z.infer<typeof socialLinksSheetSchema>;
export type VideoSheetValues = z.infer<typeof videoSheetSchema>;
export type WhatsAppSheetValues = z.infer<typeof whatsappSheetSchema>;
