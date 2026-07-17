import { z } from 'zod';

export const updatePrintStatusSchema = z
  .object({
    printed: z.boolean(),
  })
  .strict();

export type UpdatePrintStatusDto = z.infer<typeof updatePrintStatusSchema>;
