import { z } from 'zod';
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_NAME_MAX_LENGTH,
} from '../business-events.constants';

export const createEventShape = {
  name: z.string().trim().min(1).max(EVENT_NAME_MAX_LENGTH),
  description: z
    .string()
    .trim()
    .min(1)
    .max(EVENT_DESCRIPTION_MAX_LENGTH)
    .optional(),
  location: z.string().trim().min(1).max(EVENT_LOCATION_MAX_LENGTH).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
};

function refineEndAtAfterStartAt<
  T extends { startAt: Date; endAt?: Date | undefined },
>(value: T) {
  return !value.endAt || value.endAt >= value.startAt;
}

// Used by the customer-authenticated create endpoint — the host is always
// the authenticated customer, so there's no customerId field here (see
// create-event-as-employee.dto.ts for the employee-on-behalf-of variant).
export const createEventSchema = z
  .object(createEventShape)
  .strict()
  .refine(refineEndAtAfterStartAt, {
    message: 'endAt must be on or after startAt',
    path: ['endAt'],
  });

export type CreateEventDto = z.infer<typeof createEventSchema>;
export { refineEndAtAfterStartAt };
