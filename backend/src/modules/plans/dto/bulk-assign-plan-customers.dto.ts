import { z } from 'zod';
import { PLAN_BULK_ASSIGN_MAX_CUSTOMERS_PER_REQUEST } from '../plans.constants';

export const bulkAssignPlanCustomersSchema = z
  .object({
    customerIds: z
      .array(z.uuid())
      .min(1)
      .max(PLAN_BULK_ASSIGN_MAX_CUSTOMERS_PER_REQUEST),
  })
  .strict();

export type BulkAssignPlanCustomersDto = z.infer<
  typeof bulkAssignPlanCustomersSchema
>;
