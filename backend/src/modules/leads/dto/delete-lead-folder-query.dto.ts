import { z } from 'zod';
import {
  LEAD_FOLDER_DEFAULT_DELETE_MODE,
  LEAD_FOLDER_DELETE_MODES,
} from '../leads.constants';

export const deleteLeadFolderQuerySchema = z
  .object({
    mode: z
      .enum(LEAD_FOLDER_DELETE_MODES)
      .default(LEAD_FOLDER_DEFAULT_DELETE_MODE),
  })
  .strict();

export type DeleteLeadFolderQueryDto = z.infer<
  typeof deleteLeadFolderQuerySchema
>;
