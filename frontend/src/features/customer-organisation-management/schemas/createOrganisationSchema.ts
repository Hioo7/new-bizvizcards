import { z } from "zod";
import { ORGANISATION_MGMT_NAME_MAX_LENGTH } from "@features/customer-organisation-management/config";

export const createOrganisationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(ORGANISATION_MGMT_NAME_MAX_LENGTH, "Name is too long"),
  customerId: z.string().min(1, "Select a customer to be the founding SPOC"),
});

export type CreateOrganisationValues = z.infer<typeof createOrganisationSchema>;
