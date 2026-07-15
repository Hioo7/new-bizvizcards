import { z } from "zod";
import { ORGANISATION_MGMT_NAME_MAX_LENGTH } from "@features/customer-organisation-management/config";

export const editOrganisationNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(ORGANISATION_MGMT_NAME_MAX_LENGTH, "Name is too long"),
});

export type EditOrganisationNameValues = z.infer<
  typeof editOrganisationNameSchema
>;
