import { z } from 'zod';
import {
  SMART_CARD_SATISFACTION_MAX,
  SMART_CARD_TEXT_LONG_MAX_LENGTH,
  SMART_CARD_TEXT_SHORT_MAX_LENGTH,
} from '../smart-cards.constants';
import {
  createImageSlotSchema,
  updateImageSlotSchema,
} from '../../../common/validators/image-slot.dto';

const founderTextFields = {
  name: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH).optional(),
  title: z.string().trim().max(SMART_CARD_TEXT_SHORT_MAX_LENGTH).optional(),
  experience: z.coerce.number().int().min(0).optional(),
  projects: z.coerce.number().int().min(0).optional(),
  satisfaction: z.coerce
    .number()
    .int()
    .min(0)
    .max(SMART_CARD_SATISFACTION_MAX)
    .optional(),
  introText: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH).optional(),
  philosophyText: z
    .string()
    .trim()
    .max(SMART_CARD_TEXT_LONG_MAX_LENGTH)
    .optional(),
  quote: z.string().trim().max(SMART_CARD_TEXT_LONG_MAX_LENGTH).optional(),
};

export const createSmartCardFounderSchema = z
  .object({ ...founderTextFields, image: createImageSlotSchema.optional() })
  .strict()
  .optional();

export const updateSmartCardFounderSchema = z
  .object({ ...founderTextFields, image: updateImageSlotSchema.optional() })
  .strict()
  .optional();

export type CreateSmartCardFounderDto = z.infer<
  typeof createSmartCardFounderSchema
>;
export type UpdateSmartCardFounderDto = z.infer<
  typeof updateSmartCardFounderSchema
>;
