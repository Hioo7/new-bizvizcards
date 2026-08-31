import { z } from 'zod';

// Deliberately NOT .strict(): a public landing URL routinely carries unrelated
// query params (utm_*, fbclid, gclid…). Unknown keys are ignored, never
// rejected. A malformed `sref` degrades to "no attribution" via .catch rather
// than 400-ing a visitor who just wants to see the card.
export const publicEcardViewQuerySchema = z.object({
  src: z.string().optional().catch(undefined),
  sref: z.uuid().optional().catch(undefined),
});

export type PublicEcardViewQueryDto = z.infer<
  typeof publicEcardViewQuerySchema
>;
