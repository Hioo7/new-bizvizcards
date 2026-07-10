import { z } from 'zod';
import { LEAD_FOLDER_NAME_MAX_LENGTH } from '../leads.constants';

export const createLeadFolderSchema = z
  .object({
    name: z.string().trim().min(1).max(LEAD_FOLDER_NAME_MAX_LENGTH),
  })
  .strict();

export type CreateLeadFolderDto = z.infer<typeof createLeadFolderSchema>;
