import { z } from 'zod';
import {
  ECARD_TEXT_LONG_MAX_LENGTH,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from '../../ecards.constants';

export const ecardAboutUsComponentSchema = z
  .object({
    type: z.literal('ABOUT_US'),
    tagline: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    content: z.string().trim().max(ECARD_TEXT_LONG_MAX_LENGTH).optional(),
  })
  .strict();

export type EcardAboutUsComponentDto = z.infer<
  typeof ecardAboutUsComponentSchema
>;
