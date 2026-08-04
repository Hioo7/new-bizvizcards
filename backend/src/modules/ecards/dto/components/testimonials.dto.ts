import { z } from 'zod';
import {
  ECARD_MAX_TESTIMONIALS,
  ECARD_TESTIMONIAL_NAME_MAX_LENGTH,
  ECARD_TESTIMONIAL_RATING_MAX,
  ECARD_TESTIMONIAL_RATING_MIN,
  ECARD_TESTIMONIAL_TEXT_MAX_LENGTH,
} from '../../ecards.constants';

const ecardTestimonialEntrySchema = z
  .object({
    name: z.string().trim().min(1).max(ECARD_TESTIMONIAL_NAME_MAX_LENGTH),
    rating: z
      .number()
      .int()
      .min(ECARD_TESTIMONIAL_RATING_MIN)
      .max(ECARD_TESTIMONIAL_RATING_MAX),
    text: z.string().trim().min(1).max(ECARD_TESTIMONIAL_TEXT_MAX_LENGTH),
  })
  .strict();

export const ecardTestimonialsComponentSchema = z
  .object({
    type: z.literal('TESTIMONIALS'),
    entries: z
      .array(ecardTestimonialEntrySchema)
      .max(ECARD_MAX_TESTIMONIALS)
      .default([]),
  })
  .strict();

export type EcardTestimonialEntryDto = z.infer<
  typeof ecardTestimonialEntrySchema
>;
export type EcardTestimonialsComponentDto = z.infer<
  typeof ecardTestimonialsComponentSchema
>;
