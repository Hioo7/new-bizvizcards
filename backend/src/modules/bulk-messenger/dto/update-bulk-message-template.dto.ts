import { z } from 'zod';
import {
  BULK_MESSAGE_BODY_REQUIRED_ON_FORM_CHANGE_MESSAGE,
  BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH,
  BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH,
} from '../bulk-messenger.constants';

export const updateBulkMessageTemplateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH)
      .optional(),
    body: z
      .string()
      .trim()
      .min(1)
      .max(BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH)
      .optional(),
    linkedFormId: z.uuid().nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })
  // Changing (or clearing) the linked form changes the available placeholder
  // set, so the body must be re-entered in the same request.
  .refine((value) => !('linkedFormId' in value) || value.body !== undefined, {
    message: BULK_MESSAGE_BODY_REQUIRED_ON_FORM_CHANGE_MESSAGE,
    path: ['body'],
  });

export type UpdateBulkMessageTemplateDto = z.infer<
  typeof updateBulkMessageTemplateSchema
>;
