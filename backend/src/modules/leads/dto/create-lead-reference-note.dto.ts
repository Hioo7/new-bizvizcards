import { z } from 'zod';
import { LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH } from '../leads.constants';

export const createLeadReferenceNoteSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1)
      .max(LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH),
  })
  .strict();

export type CreateLeadReferenceNoteDto = z.infer<
  typeof createLeadReferenceNoteSchema
>;
