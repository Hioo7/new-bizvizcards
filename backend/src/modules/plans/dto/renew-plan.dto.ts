import { z } from 'zod';

// No fields — renewing re-extends the customer's current plan using that
// plan's own subscriptionDurationMonths. Kept as an explicit schema (rather
// than no body validation at all) so the endpoint has the same
// DTO-per-request shape as every other plan-assignment endpoint.
export const renewPlanSchema = z.object({}).strict();
export type RenewPlanDto = z.infer<typeof renewPlanSchema>;
