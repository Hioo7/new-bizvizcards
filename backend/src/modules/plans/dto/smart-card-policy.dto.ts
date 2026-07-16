import { z } from 'zod';

export const smartCardPolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxSmartCards: z.number().int().min(0),
    exchangeContactAccess: z.boolean(),
    // Empty array means no templates are permitted (strict allowlist), not
    // "no restriction" — see PLAN_EMPTY_TEMPLATE_WHITELIST_MEANS_NONE_ALLOWED.
    whitelistedTemplateIds: z.array(z.string().uuid()),
  })
  .strict();

export type SmartCardPolicyDto = z.infer<typeof smartCardPolicySchema>;
