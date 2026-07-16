import { z } from 'zod';
import { EVENT_BULK_ADD_GUESTS_MAX_PER_REQUEST } from '../business-events.constants';

export const addEventGuestSchema = z
  .object({
    customerId: z.uuid(),
  })
  .strict();

export type AddEventGuestDto = z.infer<typeof addEventGuestSchema>;

export const bulkAddEventGuestsSchema = z
  .object({
    customerIds: z
      .array(z.uuid())
      .min(1)
      .max(EVENT_BULK_ADD_GUESTS_MAX_PER_REQUEST),
  })
  .strict();

export type BulkAddEventGuestsDto = z.infer<typeof bulkAddEventGuestsSchema>;
