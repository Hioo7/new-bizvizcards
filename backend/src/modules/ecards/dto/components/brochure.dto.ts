import { z } from 'zod';
import {
  createImageSlotSchema,
  updateImageSlotSchema,
} from '../../../../common/validators/image-slot.dto';

// The pdf slot is required (not .optional() like Hero's photo) — this
// component's sole purpose is the uploaded PDF, same reasoning as
// WhatsApp's required phone number.
export const createEcardBrochureComponentSchema = z
  .object({
    type: z.literal('BROCHURE'),
    pdf: createImageSlotSchema,
  })
  .strict();

export const updateEcardBrochureComponentSchema = z
  .object({
    type: z.literal('BROCHURE'),
    pdf: updateImageSlotSchema,
  })
  .strict();

export type CreateEcardBrochureComponentDto = z.infer<
  typeof createEcardBrochureComponentSchema
>;
export type UpdateEcardBrochureComponentDto = z.infer<
  typeof updateEcardBrochureComponentSchema
>;
