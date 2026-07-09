import { z } from 'zod';
import {
  SMART_CARD_ENDPOINT_MAX_LENGTH,
  SMART_CARD_ENDPOINT_MIN_LENGTH,
  SMART_CARD_ENDPOINT_REGEX,
} from '../smart-cards.constants';
import { updateSmartCardProfileSchema } from './smart-card-profile.dto';
import { smartCardContactSchema } from './smart-card-contact.dto';
import { smartCardSocialMediaSchema } from './smart-card-social-media.dto';
import { updateSmartCardFounderSchema } from './smart-card-founder.dto';
import { updateSmartCardServicesSchema } from './smart-card-service.dto';
import { smartCardTestimonialsSchema } from './smart-card-testimonial.dto';
import { updateSmartCardGalleriesSchema } from './smart-card-gallery.dto';

// No template field at all — template is immutable after creation. `.strict()`
// also means a client sending one gets a 400, not a silent no-op.
export const updateSmartCardSchema = z
  .object({
    endpoint: z
      .string()
      .trim()
      .min(SMART_CARD_ENDPOINT_MIN_LENGTH)
      .max(SMART_CARD_ENDPOINT_MAX_LENGTH)
      .regex(SMART_CARD_ENDPOINT_REGEX)
      .optional(),
    customerId: z.uuid().nullable().optional(),
    profile: updateSmartCardProfileSchema,
    contact: smartCardContactSchema,
    socialMedia: smartCardSocialMediaSchema,
    founder: updateSmartCardFounderSchema,
    services: updateSmartCardServicesSchema,
    testimonials: smartCardTestimonialsSchema,
    galleries: updateSmartCardGalleriesSchema,
  })
  .strict();

export type UpdateSmartCardDto = z.infer<typeof updateSmartCardSchema>;
