import { z } from 'zod';
import { LEAD_FOLDER_NAME_MAX_LENGTH } from '../leads.constants';

export const updateLeadFolderSchema = z
  .object({
    name: z.string().trim().min(1).max(LEAD_FOLDER_NAME_MAX_LENGTH),
  })
  .strict();

export type UpdateLeadFolderDto = z.infer<typeof updateLeadFolderSchema>;
