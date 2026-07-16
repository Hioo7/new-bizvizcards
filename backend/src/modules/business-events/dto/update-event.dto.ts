import { z } from 'zod';
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_NAME_MAX_LENGTH,
} from '../business-events.constants';

export const updateEventSchema = z
  .object({
    name: z.string().trim().min(1).max(EVENT_NAME_MAX_LENGTH).optional(),
    description: z
      .string()
      .trim()
      .min(1)
      .max(EVENT_DESCRIPTION_MAX_LENGTH)
      .optional(),
    location: z
      .string()
      .trim()
      .min(1)
      .max(EVENT_LOCATION_MAX_LENGTH)
      .optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine(
    (value) => !value.startAt || !value.endAt || value.endAt >= value.startAt,
    { message: 'endAt must be on or after startAt', path: ['endAt'] },
  );

export type UpdateEventDto = z.infer<typeof updateEventSchema>;
