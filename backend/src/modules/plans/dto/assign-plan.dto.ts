import { z } from 'zod';

export const assignPlanShape = {
  planId: z.string().uuid(),
};

export const assignPlanSchema = z.object(assignPlanShape).strict();
export type AssignPlanDto = z.infer<typeof assignPlanSchema>;
