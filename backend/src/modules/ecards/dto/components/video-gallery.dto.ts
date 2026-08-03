import { z } from 'zod';
import {
  ECARD_CAPTION_MAX_LENGTH,
  ECARD_MAX_VIDEO_SUB_GALLERIES,
  ECARD_MAX_VIDEOS_PER_GALLERY,
  ECARD_TEXT_SHORT_MAX_LENGTH,
  ECARD_VIDEO_URL_MAX_LENGTH,
} from '../../ecards.constants';
import { normalizeEcardVideoUrl } from '../../utils/normalize-video-url.util';

// No upload slot is involved (entries are URLs, not files), so — unlike
// gallery.dto.ts — one schema serves both create and update, same convention
// as video.dto.ts's single ecardVideoComponentSchema.
const videoGalleryEntrySchema = z
  .object({
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
    caption: z.string().trim().max(ECARD_CAPTION_MAX_LENGTH).optional(),
  })
  .strict();

const videoSubGallerySchema = z
  .object({
    title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    videos: z
      .array(videoGalleryEntrySchema)
      .max(ECARD_MAX_VIDEOS_PER_GALLERY)
      .default([]),
  })
  .strict();

export const ecardVideoGalleryComponentSchema = z
  .object({
    type: z.literal('VIDEO_GALLERY'),
    subGalleries: z
      .array(videoSubGallerySchema)
      .max(ECARD_MAX_VIDEO_SUB_GALLERIES)
      .default([]),
  })
  .strict();

export type EcardVideoGalleryComponentDto = z.infer<
  typeof ecardVideoGalleryComponentSchema
>;
