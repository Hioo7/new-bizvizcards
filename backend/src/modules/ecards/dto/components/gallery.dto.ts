import { z } from 'zod';
import {
  createImageSlotSchema,
  updateImageSlotSchema,
} from '../../../../common/validators/image-slot.dto';
import {
  ECARD_CAPTION_MAX_LENGTH,
  ECARD_MAX_GALLERY_IMAGES,
  ECARD_MAX_SUB_GALLERIES,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from '../../ecards.constants';

// Caption lives alongside the image slot rather than inside
// image-slot.dto.ts, since that shared schema is also used by hero/banner/
// brochure fields that never get a caption.
const createGalleryImageEntrySchema = z
  .object({
    image: createImageSlotSchema,
    caption: z.string().trim().max(ECARD_CAPTION_MAX_LENGTH).optional(),
  })
  .strict();

const updateGalleryImageEntrySchema = z
  .object({
    image: updateImageSlotSchema,
    caption: z.string().trim().max(ECARD_CAPTION_MAX_LENGTH).optional(),
  })
  .strict();

const createSubGallerySchema = z
  .object({
    title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    images: z
      .array(createGalleryImageEntrySchema)
      .max(ECARD_MAX_GALLERY_IMAGES)
      .default([]),
  })
  .strict();

export const createEcardGalleryComponentSchema = z
  .object({
    type: z.literal('GALLERY'),
    subGalleries: z
      .array(createSubGallerySchema)
      .max(ECARD_MAX_SUB_GALLERIES)
      .default([]),
  })
  .strict();

const updateSubGallerySchema = z
  .object({
    title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    images: z
      .array(updateGalleryImageEntrySchema)
      .max(ECARD_MAX_GALLERY_IMAGES)
      .default([]),
  })
  .strict();

export const updateEcardGalleryComponentSchema = z
  .object({
    type: z.literal('GALLERY'),
    subGalleries: z
      .array(updateSubGallerySchema)
      .max(ECARD_MAX_SUB_GALLERIES)
      .default([]),
  })
  .strict();

export type CreateEcardGalleryComponentDto = z.infer<
  typeof createEcardGalleryComponentSchema
>;
export type UpdateEcardGalleryComponentDto = z.infer<
  typeof updateEcardGalleryComponentSchema
>;
