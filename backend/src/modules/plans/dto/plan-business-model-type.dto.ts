import { z } from 'zod';
import { PlanBusinessModelType } from '../../../generated/prisma/client';

export const planBusinessModelTypeSchema = z.enum(PlanBusinessModelType);
export type PlanBusinessModelTypeDto = z.infer<
  typeof planBusinessModelTypeSchema
>;
