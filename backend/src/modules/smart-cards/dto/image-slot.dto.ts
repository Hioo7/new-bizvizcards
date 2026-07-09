import { z } from 'zod';

// Create: a slot either has no image, or is backed by a file uploaded under
// this request's positionally-derived field name (see smart-cards.constants.ts) —
// there is nothing for the client to invent; the field name is fully
// determined by the slot's position in the payload.
export const createImageSlotSchema = z
  .object({ action: z.literal('upload') })
  .strict();

// Update: additionally allows referencing an existing ImageMedia row to keep
// unchanged. The service (not the schema) verifies the mediaId actually
// belongs to this card's current tree before trusting it — never trust a
// client-supplied id blindly.
export const updateImageSlotSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('upload') }).strict(),
  z.object({ action: z.literal('keep'), mediaId: z.uuid() }).strict(),
]);

export type CreateImageSlotDto = z.infer<typeof createImageSlotSchema>;
export type UpdateImageSlotDto = z.infer<typeof updateImageSlotSchema>;
