import { z } from 'zod';

export const linkExistingInviteMemberSchema = z
  .object({
    customerId: z.uuid(),
  })
  .strict();

export type LinkExistingInviteMemberDto = z.infer<
  typeof linkExistingInviteMemberSchema
>;
