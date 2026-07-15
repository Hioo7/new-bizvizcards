import { z } from "zod";
import { CUSTOMER_MGMT_NAME_MAX_LENGTH } from "@features/customer-organisation-management/config";

export const editCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(CUSTOMER_MGMT_NAME_MAX_LENGTH, "Name is too long"),
  email: z.email("Please enter a valid email address"),
});

export type EditCustomerValues = z.infer<typeof editCustomerSchema>;
