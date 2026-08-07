import { z } from 'zod';
import { VirtualBackgroundQrCorner } from '../../../generated/prisma/client';
import { VIRTUAL_BACKGROUND_CAPTION_MAX_LENGTH } from '../virtual-backgrounds.constants';

const baseShape = {
  ecardId: z.string().uuid(),
  qrCorner: z.enum(VirtualBackgroundQrCorner).default('BOTTOM_RIGHT'),
  captionText: z
    .string()
    .trim()
    .min(1)
    .max(VIRTUAL_BACKGROUND_CAPTION_MAX_LENGTH)
    .optional(),
};

// Discriminated on `source`: TEMPLATE picks a shared-library template by id
// (no file upload needed), CUSTOM supplies its own base image as a separate
// multipart file part — exactly one of the two is ever true for a given
// virtual background, enforced here at the schema level rather than the
// service layer.
export const createVirtualBackgroundSchema = z.discriminatedUnion('source', [
  z
    .object({
      source: z.literal('TEMPLATE'),
      templateId: z.string().uuid(),
      ...baseShape,
    })
    .strict(),
  z.object({ source: z.literal('CUSTOM'), ...baseShape }).strict(),
]);

export type CreateVirtualBackgroundDto = z.infer<
  typeof createVirtualBackgroundSchema
>;
