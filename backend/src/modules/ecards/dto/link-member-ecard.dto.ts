import { z } from 'zod';

export const linkMemberEcardSchema = z
  .object({
    ecardId: z.uuid(),
  })
  .strict();

export type LinkMemberEcardDto = z.infer<typeof linkMemberEcardSchema>;
