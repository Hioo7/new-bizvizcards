import { z } from 'zod';
import {
  SMART_CARD_MAX_GALLERIES,
  SMART_CARD_MAX_GALLERY_IMAGES,
  SMART_CARD_TEXT_SHORT_MAX_LENGTH,
} from '../smart-cards.constants';
import {
  createImageSlotSchema,
  updateImageSlotSchema,
} from '../../../common/validators/image-slot.dto';

// A gallery image IS an image slot — required, no "no image" gallery image.
export const createSmartCardGallerySchema = z
  .object({
    title: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH).optional(),
    images: z
      .array(createImageSlotSchema)
      .max(SMART_CARD_MAX_GALLERY_IMAGES)
      .default([]),
  })
  .strict();
export const createSmartCardGalleriesSchema = z
  .array(createSmartCardGallerySchema)
  .max(SMART_CARD_MAX_GALLERIES)
  .default([]);

export const updateSmartCardGallerySchema = z
  .object({
    title: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH).optional(),
    images: z
      .array(updateImageSlotSchema)
      .max(SMART_CARD_MAX_GALLERY_IMAGES)
      .default([]),
  })
  .strict();
export const updateSmartCardGalleriesSchema = z
  .array(updateSmartCardGallerySchema)
  .max(SMART_CARD_MAX_GALLERIES)
  .default([]);

export type CreateSmartCardGalleryDto = z.infer<
  typeof createSmartCardGallerySchema
>;
export type UpdateSmartCardGalleryDto = z.infer<
  typeof updateSmartCardGallerySchema
>;
