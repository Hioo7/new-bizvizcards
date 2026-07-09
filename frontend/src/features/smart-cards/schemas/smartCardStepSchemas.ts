import { z } from "zod";
import {
  SMART_CARD_ENDPOINT_MAX_LENGTH,
  SMART_CARD_ENDPOINT_MIN_LENGTH,
  SMART_CARD_ENDPOINT_REGEX,
  SMART_CARD_MAX_GALLERIES,
  SMART_CARD_MAX_GALLERY_IMAGES,
  SMART_CARD_MAX_SERVICES,
  SMART_CARD_MAX_TESTIMONIALS,
  SMART_CARD_SATISFACTION_MAX,
  SMART_CARD_TEXT_LONG_MAX_LENGTH,
  SMART_CARD_TEXT_MEDIUM_MAX_LENGTH,
  SMART_CARD_TEXT_SHORT_MAX_LENGTH,
} from "@features/smart-cards/config/smartCardForm.config";

const imageFieldSchema = z.object({
  file: z.instanceof(File).nullable(),
  existingMediaId: z.string().optional(),
  existingUrl: z.string().optional(),
});

const optionalInt = (max?: number) => {
  const base = z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), {
      message: "Enter a whole number.",
    });
  return max === undefined
    ? base
    : base.refine((value) => value === "" || Number(value) <= max, {
        message: `Must be ${max} or less.`,
      });
};

export const customerStepSchema = z.object({
  customerId: z.string().min(1, "Select a customer to link this card to."),
});

export const profileStepSchema = z.object({
  endpoint: z
    .string()
    .trim()
    .min(
      SMART_CARD_ENDPOINT_MIN_LENGTH,
      `Must be at least ${SMART_CARD_ENDPOINT_MIN_LENGTH} characters.`,
    )
    .max(SMART_CARD_ENDPOINT_MAX_LENGTH)
    .regex(SMART_CARD_ENDPOINT_REGEX, "Lowercase letters, numbers and hyphens only."),
  companyName: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  tagline: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  subTagline: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  aboutText: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH),
  logo: imageFieldSchema,
});

export const contactStepSchema = z.object({
  contactNumber: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Enter a valid email address.",
    }),
  address: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
});

export const socialStepSchema = z.object({
  whatsapp: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  instagram: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  facebook: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  linkedIn: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  twitter: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  youtube: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  googleMap: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  website: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
  other: z.string().trim().max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH),
});

export const founderStepSchema = z.object({
  name: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  title: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  experience: optionalInt(),
  projects: optionalInt(),
  satisfaction: optionalInt(SMART_CARD_SATISFACTION_MAX),
  introText: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH),
  philosophyText: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH),
  quote: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH),
  image: imageFieldSchema,
});

const serviceItemSchema = z.object({
  title: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  description: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH),
  image: imageFieldSchema,
});

export const servicesStepSchema = z.object({
  services: z.array(serviceItemSchema).max(SMART_CARD_MAX_SERVICES),
});

const testimonialItemSchema = z.object({
  name: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  initials: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  text: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH),
});

export const testimonialsStepSchema = z.object({
  testimonials: z.array(testimonialItemSchema).max(SMART_CARD_MAX_TESTIMONIALS),
});

const galleryItemSchema = z.object({
  title: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH),
  images: z.array(imageFieldSchema).max(SMART_CARD_MAX_GALLERY_IMAGES),
});

export const galleryStepSchema = z.object({
  galleries: z.array(galleryItemSchema).max(SMART_CARD_MAX_GALLERIES),
});
