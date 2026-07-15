import { z } from "zod";
import { CUSTOMER_MGMT_BAN_REASON_MAX_LENGTH } from "@features/customer-organisation-management/config";

export const banCustomerSchema = z.object({
  banReason: z
    .string()
    .trim()
    .max(CUSTOMER_MGMT_BAN_REASON_MAX_LENGTH, "Reason is too long")
    .optional(),
});

export type BanCustomerValues = z.infer<typeof banCustomerSchema>;
