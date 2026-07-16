import { z } from 'zod';
import { assignPlanShape } from './assign-plan.dto';

// Same shape as assigning a plan — kept as a separate named schema since it
// backs a distinct endpoint (switching an existing assignment), even though
// the payload is identical.
export const switchPlanSchema = z.object(assignPlanShape).strict();
export type SwitchPlanDto = z.infer<typeof switchPlanSchema>;
