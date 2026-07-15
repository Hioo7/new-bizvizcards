import { z } from "zod";
import { BULK_ADD_MEMBERS_MAX_PER_REQUEST } from "@features/customer-organisation-management/config";

export const addOrganisationMemberSchema = z.object({
  customerIds: z
    .array(z.string())
    .min(1, "Select at least one customer to add")
    .max(
      BULK_ADD_MEMBERS_MAX_PER_REQUEST,
      `Select at most ${BULK_ADD_MEMBERS_MAX_PER_REQUEST} customers per batch`,
    ),
  role: z.enum(["SPOC", "MEMBER"]),
});

export type AddOrganisationMemberValues = z.infer<
  typeof addOrganisationMemberSchema
>;
