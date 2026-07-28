import { z } from 'zod';
import {
  ECARD_TEXT_SHORT_MAX_LENGTH,
  ECARD_VIDEO_URL_MAX_LENGTH,
} from '../../ecards.constants';
import { normalizeEcardVideoUrl } from '../../utils/normalize-video-url.util';

export const ecardVideoComponentSchema = z
  .object({
    type: z.literal('VIDEO'),
    title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    videoUrl: z
      .string()
      .trim()
      .max(ECARD_VIDEO_URL_MAX_LENGTH)
      .transform((value, ctx) => {
        const normalized = normalizeEcardVideoUrl(value);
        if (!normalized) {
          ctx.addIssue({
            code: 'custom',
            message: 'Enter a valid YouTube or Vimeo link',
          });
          return z.NEVER;
        }
        return normalized;
      }),
  })
  .strict();

export type EcardVideoComponentDto = z.infer<typeof ecardVideoComponentSchema>;
