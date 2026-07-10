import { z } from 'zod';
import {
  REDIRECT_PATH_REGEX,
  REDIRECT_RESTRICTED_PATH_MAX_LENGTH,
} from '../redirects.constants';

export const createRestrictedPathSchema = z
  .object({
    path: z
      .string()
      .trim()
      .min(1)
      .max(REDIRECT_RESTRICTED_PATH_MAX_LENGTH)
      .regex(REDIRECT_PATH_REGEX),
  })
  .strict();

export type CreateRestrictedPathDto = z.infer<
  typeof createRestrictedPathSchema
>;
