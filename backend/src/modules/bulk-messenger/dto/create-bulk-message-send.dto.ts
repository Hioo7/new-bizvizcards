import { z } from 'zod';
import { BULK_MESSAGE_SEND_MAX_RECIPIENTS } from '../bulk-messenger.constants';

export const createBulkMessageSendSchema = z
  .object({
    templateId: z.uuid(),
    leadIds: z.array(z.uuid()).min(1).max(BULK_MESSAGE_SEND_MAX_RECIPIENTS),
  })
  .strict();

export type CreateBulkMessageSendDto = z.infer<
  typeof createBulkMessageSendSchema
>;
