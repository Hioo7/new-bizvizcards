import { z } from 'zod';
import {
  PLAN_NAME_MAX_LENGTH,
  PLAN_PRICE_MAX,
  PLAN_SUBSCRIPTION_DURATION_MIN_MONTHS,
  PLAN_SUBSCRIPTION_DURATION_MAX_MONTHS,
} from '../plans.constants';
import { planBusinessModelTypeSchema } from './plan-business-model-type.dto';
import { ecardPolicySchema } from './ecard-policy.dto';
import { smartCardPolicySchema } from './smart-card-policy.dto';
import { organisationPolicySchema } from './organisation-policy.dto';
import { eventPolicySchema } from './event-policy.dto';

export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1).max(PLAN_NAME_MAX_LENGTH).optional(),
    price: z.number().min(0).max(PLAN_PRICE_MAX).optional(),
    businessModelType: planBusinessModelTypeSchema.optional(),
    subscriptionDurationMonths: z
      .number()
      .int()
      .min(PLAN_SUBSCRIPTION_DURATION_MIN_MONTHS)
      .max(PLAN_SUBSCRIPTION_DURATION_MAX_MONTHS)
      .optional(),
    isPublic: z.boolean().optional(),
    ecardPolicy: ecardPolicySchema.optional(),
    smartCardPolicy: smartCardPolicySchema.optional(),
    organisationPolicy: organisationPolicySchema.optional(),
    eventPolicy: eventPolicySchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine(
    (value) =>
      value.businessModelType !== 'SUBSCRIPTION' ||
      value.subscriptionDurationMonths !== undefined,
    {
      message:
        'subscriptionDurationMonths is required when setting businessModelType to SUBSCRIPTION',
      path: ['subscriptionDurationMonths'],
    },
  );

export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
