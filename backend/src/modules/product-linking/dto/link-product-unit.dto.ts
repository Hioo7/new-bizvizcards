import { z } from 'zod';
import { LinkedCardType } from '../../../generated/prisma/client';

// Shared by both claim (unit currently unlinked) and relink (unit already
// owned by the caller) — same shape, different service-level rules.
export const linkProductUnitSchema = z
  .object({
    cardType: z.enum(LinkedCardType),
    cardId: z.uuid(),
  })
  .strict();

export type LinkProductUnitDto = z.infer<typeof linkProductUnitSchema>;
