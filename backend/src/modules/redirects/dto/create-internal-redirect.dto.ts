import { z } from 'zod';
import {
  REDIRECT_PATH_REGEX,
  REDIRECT_SOURCE_PATH_MAX_LENGTH,
  REDIRECT_TARGET_PATH_MAX_LENGTH,
} from '../redirects.constants';

export const createInternalRedirectSchema = z
  .object({
    sourcePath: z
      .string()
      .trim()
      .min(1)
      .max(REDIRECT_SOURCE_PATH_MAX_LENGTH)
      .regex(REDIRECT_PATH_REGEX),
    targetPath: z
      .string()
      .trim()
      .min(1)
      .max(REDIRECT_TARGET_PATH_MAX_LENGTH)
      .regex(REDIRECT_PATH_REGEX),
    enabled: z.boolean().optional(),
  })
  .strict();

export type CreateInternalRedirectDto = z.infer<
  typeof createInternalRedirectSchema
>;
