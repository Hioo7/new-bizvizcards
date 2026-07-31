import { z } from "zod";

export const linkExistingInviteMemberSchema = z.object({
  customerId: z.string().min(1, "Select a customer to link"),
});

export type LinkExistingInviteMemberValues = z.infer<
  typeof linkExistingInviteMemberSchema
>;
