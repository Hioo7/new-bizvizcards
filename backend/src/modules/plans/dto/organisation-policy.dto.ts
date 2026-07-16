import { z } from 'zod';
import { ecardPolicySchema } from './ecard-policy.dto';
import { smartCardPolicySchema } from './smart-card-policy.dto';

export const organisationPolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxOrgsCanJoin: z.number().int().min(0),
    maxOrgsCanCreate: z.number().int().min(0),
    // An organisation's own shared policy — not derived from any member's
    // personal plan. Reuses the e-card/smart-card policy shapes directly.
    orgEcardPolicy: ecardPolicySchema,
    orgSmartCardPolicy: smartCardPolicySchema,
  })
  .strict();

export type OrganisationPolicyDto = z.infer<typeof organisationPolicySchema>;
