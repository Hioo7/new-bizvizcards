import { z } from 'zod';

// Full target set, not a delta — ExchangeContactFormsService.setLinkedEcards
// diffs this against the form's currently-linked e-cards and applies
// link/unlink atomically in one transaction.
export const linkExchangeContactFormEcardsSchema = z
  .object({
    ecardIds: z.array(z.uuid()),
  })
  .strict();

export type LinkExchangeContactFormEcardsDto = z.infer<
  typeof linkExchangeContactFormEcardsSchema
>;
