import { z } from 'zod';
import { VIRTUAL_BACKGROUND_TEMPLATE_NAME_MAX_LENGTH } from '../virtual-backgrounds.constants';

export const createVirtualBackgroundTemplateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(VIRTUAL_BACKGROUND_TEMPLATE_NAME_MAX_LENGTH),
  })
  .strict();

export type CreateVirtualBackgroundTemplateDto = z.infer<
  typeof createVirtualBackgroundTemplateSchema
>;
