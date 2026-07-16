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

export const createPlanShape = {
  name: z.string().trim().min(1).max(PLAN_NAME_MAX_LENGTH),
  price: z.number().min(0).max(PLAN_PRICE_MAX),
  businessModelType: planBusinessModelTypeSchema,
  // Required iff businessModelType === 'SUBSCRIPTION' — enforced by the
  // refines below.
  subscriptionDurationMonths: z
    .number()
    .int()
    .min(PLAN_SUBSCRIPTION_DURATION_MIN_MONTHS)
    .max(PLAN_SUBSCRIPTION_DURATION_MAX_MONTHS)
    .optional(),
  isPublic: z.boolean().default(false),
  ecardPolicy: ecardPolicySchema,
  smartCardPolicy: smartCardPolicySchema,
  organisationPolicy: organisationPolicySchema,
  eventPolicy: eventPolicySchema,
};

export const createPlanSchema = z
  .object(createPlanShape)
  .strict()
  .refine(
    (value) =>
      value.businessModelType !== 'SUBSCRIPTION' ||
      value.subscriptionDurationMonths !== undefined,
    {
      message: 'subscriptionDurationMonths is required for SUBSCRIPTION plans',
      path: ['subscriptionDurationMonths'],
    },
  )
  .refine(
    (value) =>
      value.businessModelType === 'SUBSCRIPTION' ||
      value.subscriptionDurationMonths === undefined,
    {
      message:
        'subscriptionDurationMonths must be omitted for non-SUBSCRIPTION plans',
      path: ['subscriptionDurationMonths'],
    },
  );

export type CreatePlanDto = z.infer<typeof createPlanSchema>;
