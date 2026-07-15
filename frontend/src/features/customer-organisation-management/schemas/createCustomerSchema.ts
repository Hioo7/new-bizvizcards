import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@config/password.config";
import { CUSTOMER_MGMT_NAME_MAX_LENGTH } from "@features/customer-organisation-management/config";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(CUSTOMER_MGMT_NAME_MAX_LENGTH, "Name is too long"),
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    ),
});

export type CreateCustomerValues = z.infer<typeof createCustomerSchema>;
