import { z } from 'zod';
import { LeadSourceType } from '../../../generated/prisma/client';

export const leadSourceTypeSchema = z.enum(LeadSourceType);
export type LeadSourceTypeDto = z.infer<typeof leadSourceTypeSchema>;
