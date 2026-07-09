import { z } from 'zod';
import {
  SMART_CARD_ENDPOINT_MAX_LENGTH,
  SMART_CARD_ENDPOINT_MIN_LENGTH,
  SMART_CARD_ENDPOINT_REGEX,
} from '../smart-cards.constants';
import { createSmartCardProfileSchema } from './smart-card-profile.dto';
import { smartCardContactSchema } from './smart-card-contact.dto';
import { smartCardSocialMediaSchema } from './smart-card-social-media.dto';
import { createSmartCardFounderSchema } from './smart-card-founder.dto';
import { createSmartCardServicesSchema } from './smart-card-service.dto';
import { smartCardTestimonialsSchema } from './smart-card-testimonial.dto';
import { createSmartCardGalleriesSchema } from './smart-card-gallery.dto';

export const createSmartCardSchema = z
  .object({
    endpoint: z
      .string()
      .trim()
      .min(SMART_CARD_ENDPOINT_MIN_LENGTH)
      .max(SMART_CARD_ENDPOINT_MAX_LENGTH)
      .regex(SMART_CARD_ENDPOINT_REGEX),
    customerId: z.uuid().optional(),
    profile: createSmartCardProfileSchema,
    contact: smartCardContactSchema,
    socialMedia: smartCardSocialMediaSchema,
    founder: createSmartCardFounderSchema,
    services: createSmartCardServicesSchema,
    testimonials: smartCardTestimonialsSchema,
    galleries: createSmartCardGalleriesSchema,
  })
  .strict();

export type CreateSmartCardDto = z.infer<typeof createSmartCardSchema>;
