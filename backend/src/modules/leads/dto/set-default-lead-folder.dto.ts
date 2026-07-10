import { z } from 'zod';

export const setDefaultLeadFolderSchema = z
  .object({
    folderId: z.string().uuid().nullable(),
  })
  .strict();

export type SetDefaultLeadFolderDto = z.infer<
  typeof setDefaultLeadFolderSchema
>;
