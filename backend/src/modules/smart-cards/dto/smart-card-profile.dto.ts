import { z } from 'zod';
import {
  SMART_CARD_TEXT_LONG_MAX_LENGTH,
  SMART_CARD_TEXT_MEDIUM_MAX_LENGTH,
  SMART_CARD_TEXT_SHORT_MAX_LENGTH,
} from '../smart-cards.constants';
import {
  createImageSlotSchema,
  updateImageSlotSchema,
} from '../../../common/validators/image-slot.dto';

const profileTextFields = {
  companyName: z
    .string()
    .trim()
    .max(SMART_CARD_TEXT_SHORT_MAX_LENGTH)
    .optional(),
  tagline: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH).optional(),
  subTagline: z
    .string()
    .trim()
    .max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH)
    .optional(),
  aboutText: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH).optional(),
};

export const createSmartCardProfileSchema = z
  .object({ ...profileTextFields, logo: createImageSlotSchema.optional() })
  .strict()
  .optional();

export const updateSmartCardProfileSchema = z
  .object({ ...profileTextFields, logo: updateImageSlotSchema.optional() })
  .strict()
  .optional();

export type CreateSmartCardProfileDto = z.infer<
  typeof createSmartCardProfileSchema
>;
export type UpdateSmartCardProfileDto = z.infer<
  typeof updateSmartCardProfileSchema
>;
