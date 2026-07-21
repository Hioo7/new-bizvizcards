import { z } from "zod";
import { PLAN_BULK_ASSIGN_MAX_CUSTOMERS_PER_REQUEST } from "@features/plans/config";

export const bulkAssignPlanCustomersSchema = z.object({
  customerIds: z
    .array(z.string())
    .min(1, "Select at least one customer")
    .max(
      PLAN_BULK_ASSIGN_MAX_CUSTOMERS_PER_REQUEST,
      `Select at most ${PLAN_BULK_ASSIGN_MAX_CUSTOMERS_PER_REQUEST} customers per batch`,
    ),
});

export type BulkAssignPlanCustomersValues = z.infer<
  typeof bulkAssignPlanCustomersSchema
>;
