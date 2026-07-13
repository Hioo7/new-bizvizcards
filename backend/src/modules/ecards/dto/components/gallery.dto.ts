import { z } from 'zod';
import {
  createImageSlotSchema,
  updateImageSlotSchema,
} from '../../../../common/validators/image-slot.dto';
import {
  ECARD_MAX_GALLERY_IMAGES,
  ECARD_MAX_SUB_GALLERIES,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from '../../ecards.constants';

const createSubGallerySchema = z
  .object({
    title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    images: z
      .array(createImageSlotSchema)
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
      .array(updateImageSlotSchema)
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
