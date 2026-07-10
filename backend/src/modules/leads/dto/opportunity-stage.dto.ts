import { z } from 'zod';
import { OpportunityStage } from '../../../generated/prisma/client';

export const opportunityStageSchema = z.enum(OpportunityStage);
export type OpportunityStageDto = z.infer<typeof opportunityStageSchema>;
