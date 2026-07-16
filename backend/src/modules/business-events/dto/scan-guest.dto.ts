import { z } from 'zod';

// Not a Prisma enum — ECard and SmartCard are separate tables, there's no
// shared "card type" column anywhere in the schema. This discriminates which
// table a scanned QR code's endpoint should be looked up against.
export const EVENT_SCAN_CARD_TYPES = ['ECARD', 'SMART_CARD'] as const;
export type EventScanCardType = (typeof EVENT_SCAN_CARD_TYPES)[number];

export const scanGuestSchema = z
  .object({
    cardType: z.enum(EVENT_SCAN_CARD_TYPES),
    endpoint: z.string().trim().min(1),
  })
  .strict();

export type ScanGuestDto = z.infer<typeof scanGuestSchema>;
