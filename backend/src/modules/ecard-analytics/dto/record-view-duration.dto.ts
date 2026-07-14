import { z } from 'zod';
import { ECARD_VIEW_MAX_DURATION_MS } from '../ecard-analytics.constants';

export const recordViewDurationSchema = z
  .object({
    durationMs: z.number().int().min(0).max(ECARD_VIEW_MAX_DURATION_MS),
  })
  .strict();

export type RecordViewDurationDto = z.infer<typeof recordViewDurationSchema>;
