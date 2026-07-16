import { z } from 'zod';
import { createEventShape, refineEndAtAfterStartAt } from './create-event.dto';

// The employee-on-behalf-of-a-customer variant — same fields as
// createEventSchema plus the customerId who becomes the host, since there's
// no customer session here to derive it from.
export const createEventAsEmployeeSchema = z
  .object({
    customerId: z.uuid(),
    ...createEventShape,
  })
  .strict()
  .refine(refineEndAtAfterStartAt, {
    message: 'endAt must be on or after startAt',
    path: ['endAt'],
  });

export type CreateEventAsEmployeeDto = z.infer<
  typeof createEventAsEmployeeSchema
>;
