import { z } from 'zod';
import { LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH } from '../leads.constants';

export const updateLeadReferenceNoteSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1)
      .max(LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH),
  })
  .strict();

export type UpdateLeadReferenceNoteDto = z.infer<
  typeof updateLeadReferenceNoteSchema
>;
