import { z } from 'zod';
import {
  EVENT_TRACKABLE_DESCRIPTION_MAX_LENGTH,
  EVENT_TRACKABLE_MAX_DEPENDENCIES,
  EVENT_TRACKABLE_NAME_MAX_LENGTH,
} from '../business-events.constants';

export const createEventTrackableSchema = z
  .object({
    name: z.string().trim().min(1).max(EVENT_TRACKABLE_NAME_MAX_LENGTH),
    description: z
      .string()
      .trim()
      .min(1)
      .max(EVENT_TRACKABLE_DESCRIPTION_MAX_LENGTH)
      .optional(),
    // Other trackables (from the same event) that must be redeemed before
    // this one can be — omitted/empty means no dependencies.
    dependsOnTrackableIds: z
      .array(z.uuid())
      .max(EVENT_TRACKABLE_MAX_DEPENDENCIES)
      .optional(),
  })
  .strict();

export type CreateEventTrackableDto = z.infer<
  typeof createEventTrackableSchema
>;
