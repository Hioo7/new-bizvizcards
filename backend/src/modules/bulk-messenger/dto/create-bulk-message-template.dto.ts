import { z } from 'zod';
import {
  BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH,
  BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH,
} from '../bulk-messenger.constants';

export const createBulkMessageTemplateSchema = z
  .object({
    name: z.string().trim().min(1).max(BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH),
    body: z.string().trim().min(1).max(BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH),
    // `null` and omitted both mean "no linked form".
    linkedFormId: z.uuid().nullable().optional(),
  })
  .strict();

export type CreateBulkMessageTemplateDto = z.infer<
  typeof createBulkMessageTemplateSchema
>;
