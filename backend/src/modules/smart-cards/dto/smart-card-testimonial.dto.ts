import { z } from 'zod';
import {
  SMART_CARD_MAX_TESTIMONIALS,
  SMART_CARD_TEXT_LONG_MAX_LENGTH,
  SMART_CARD_TEXT_SHORT_MAX_LENGTH,
} from '../smart-cards.constants';

export const smartCardTestimonialSchema = z
  .object({
    name: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH).optional(),
    initials: z
      .string()
      .trim()
      .max(SMART_CARD_TEXT_SHORT_MAX_LENGTH)
      .optional(),
    text: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH).optional(),
  })
  .strict();

export const smartCardTestimonialsSchema = z
  .array(smartCardTestimonialSchema)
  .max(SMART_CARD_MAX_TESTIMONIALS)
  .default([]);

export type SmartCardTestimonialDto = z.infer<
  typeof smartCardTestimonialSchema
>;
