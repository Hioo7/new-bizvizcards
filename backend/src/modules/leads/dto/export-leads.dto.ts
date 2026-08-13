import { z } from 'zod';
import { LEAD_EXPORT_MAX_IDS } from '../leads.constants';

export const exportLeadsSchema = z
  .object({
    leadIds: z.array(z.string().uuid()).min(1).max(LEAD_EXPORT_MAX_IDS),
  })
  .strict();

export type ExportLeadsDto = z.infer<typeof exportLeadsSchema>;
