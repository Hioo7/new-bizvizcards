import { z } from 'zod';
import {
  REDIRECT_PATH_REGEX,
  REDIRECT_SOURCE_PATH_MAX_LENGTH,
  REDIRECT_TARGET_PATH_MAX_LENGTH,
} from '../redirects.constants';

export const updateInternalRedirectSchema = z
  .object({
    sourcePath: z
      .string()
      .trim()
      .min(1)
      .max(REDIRECT_SOURCE_PATH_MAX_LENGTH)
      .regex(REDIRECT_PATH_REGEX)
      .optional(),
    targetPath: z
      .string()
      .trim()
      .min(1)
      .max(REDIRECT_TARGET_PATH_MAX_LENGTH)
      .regex(REDIRECT_PATH_REGEX)
      .optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export type UpdateInternalRedirectDto = z.infer<
  typeof updateInternalRedirectSchema
>;
