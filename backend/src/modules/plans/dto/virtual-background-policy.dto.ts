import { z } from 'zod';

export const virtualBackgroundPolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxVirtualBackgrounds: z.number().int().min(0),
    allowCustomBackground: z.boolean(),
    // Empty array means no shared-library templates are offered (strict
    // allowlist), not "no restriction" — see
    // PLAN_EMPTY_VIRTUAL_BACKGROUND_WHITELIST_MEANS_NONE_ALLOWED.
    whitelistedTemplateIds: z.array(z.string().uuid()),
  })
  .strict();

export type VirtualBackgroundPolicyDto = z.infer<
  typeof virtualBackgroundPolicySchema
>;
