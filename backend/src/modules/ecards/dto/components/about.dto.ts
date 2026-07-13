import { z } from 'zod';
import {
  ECARD_TEXT_LONG_MAX_LENGTH,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from '../../ecards.constants';

export const ecardAboutComponentSchema = z
  .object({
    type: z.literal('ABOUT'),
    profession: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    shortNote: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    description: z.string().trim().max(ECARD_TEXT_LONG_MAX_LENGTH).optional(),
    aboutMe: z.string().trim().max(ECARD_TEXT_LONG_MAX_LENGTH).optional(),
  })
  .strict();

export type EcardAboutComponentDto = z.infer<typeof ecardAboutComponentSchema>;
