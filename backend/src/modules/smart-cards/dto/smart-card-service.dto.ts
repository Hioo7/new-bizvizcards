import { z } from 'zod';
import {
  SMART_CARD_MAX_SERVICES,
  SMART_CARD_TEXT_LONG_MAX_LENGTH,
  SMART_CARD_TEXT_SHORT_MAX_LENGTH,
} from '../smart-cards.constants';
import {
  createImageSlotSchema,
  updateImageSlotSchema,
} from '../../../common/validators/image-slot.dto';

const serviceTextFields = {
  title: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH).optional(),
  description: z
    .string()
    .trim()
    .max(SMART_CARD_TEXT_LONG_MAX_LENGTH)
    .optional(),
};

export const createSmartCardServiceSchema = z
  .object({ ...serviceTextFields, image: createImageSlotSchema.optional() })
  .strict();
export const createSmartCardServicesSchema = z
  .array(createSmartCardServiceSchema)
  .max(SMART_CARD_MAX_SERVICES)
  .default([]);

export const updateSmartCardServiceSchema = z
  .object({ ...serviceTextFields, image: updateImageSlotSchema.optional() })
  .strict();
export const updateSmartCardServicesSchema = z
  .array(updateSmartCardServiceSchema)
  .max(SMART_CARD_MAX_SERVICES)
  .default([]);

export type CreateSmartCardServiceDto = z.infer<
  typeof createSmartCardServiceSchema
>;
export type UpdateSmartCardServiceDto = z.infer<
  typeof updateSmartCardServiceSchema
>;
