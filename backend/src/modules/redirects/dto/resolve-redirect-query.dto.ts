import { z } from 'zod';
import { REDIRECT_PATH_REGEX } from '../redirects.constants';

export const resolveRedirectQuerySchema = z
  .object({
    path: z.string().trim().min(1).regex(REDIRECT_PATH_REGEX),
  })
  .strict();

export type ResolveRedirectQueryDto = z.infer<
  typeof resolveRedirectQuerySchema
>;
