import { z } from 'zod';
import {
  REDIRECT_DESTINATION_URL_MAX_LENGTH,
  REDIRECT_PATH_REGEX,
  REDIRECT_SOURCE_PATH_MAX_LENGTH,
} from '../redirects.constants';

export const createExternalRedirectSchema = z
  .object({
    sourcePath: z
      .string()
      .trim()
      .min(1)
      .max(REDIRECT_SOURCE_PATH_MAX_LENGTH)
      .regex(REDIRECT_PATH_REGEX),
    destinationUrl: z.httpUrl().trim().max(REDIRECT_DESTINATION_URL_MAX_LENGTH),
    enabled: z.boolean().optional(),
  })
  .strict();

export type CreateExternalRedirectDto = z.infer<
  typeof createExternalRedirectSchema
>;
