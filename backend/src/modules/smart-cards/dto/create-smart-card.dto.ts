import { z } from 'zod';
import {
  URL_SLUG_MAX_LENGTH,
  URL_SLUG_MIN_LENGTH,
  URL_SLUG_REGEX,
} from '../../../common/constants/slug.constants';
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
      .min(URL_SLUG_MIN_LENGTH)
      .max(URL_SLUG_MAX_LENGTH)
      .regex(URL_SLUG_REGEX),
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
