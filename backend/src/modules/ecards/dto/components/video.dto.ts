import { z } from 'zod';
import {
  ECARD_TEXT_SHORT_MAX_LENGTH,
  ECARD_VIDEO_URL_ALLOWED_HOST_PATTERN,
  ECARD_VIDEO_URL_MAX_LENGTH,
} from '../../ecards.constants';

export const ecardVideoComponentSchema = z
  .object({
    type: z.literal('VIDEO'),
    title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    videoUrl: z
      .string()
      .trim()
      .max(ECARD_VIDEO_URL_MAX_LENGTH)
      .regex(ECARD_VIDEO_URL_ALLOWED_HOST_PATTERN),
  })
  .strict();

export type EcardVideoComponentDto = z.infer<typeof ecardVideoComponentSchema>;
