import { z } from 'zod';
import {
  EVENT_TRACKABLE_DESCRIPTION_MAX_LENGTH,
  EVENT_TRACKABLE_MAX_DEPENDENCIES,
  EVENT_TRACKABLE_NAME_MAX_LENGTH,
} from '../business-events.constants';

export const updateEventTrackableSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(EVENT_TRACKABLE_NAME_MAX_LENGTH)
      .optional(),
    description: z
      .string()
      .trim()
      .min(1)
      .max(EVENT_TRACKABLE_DESCRIPTION_MAX_LENGTH)
      .optional(),
    // undefined = don't touch dependencies; an explicit array (including an
    // empty one) fully replaces the current dependency list.
    dependsOnTrackableIds: z
      .array(z.uuid())
      .max(EVENT_TRACKABLE_MAX_DEPENDENCIES)
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateEventTrackableDto = z.infer<
  typeof updateEventTrackableSchema
>;
