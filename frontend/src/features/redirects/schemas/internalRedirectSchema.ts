import { z } from "zod";
import {
  REDIRECT_PATH_REGEX,
  REDIRECT_SOURCE_PATH_MAX_LENGTH,
  REDIRECT_TARGET_PATH_MAX_LENGTH,
} from "@features/redirects/config";

export const internalRedirectSchema = z.object({
  sourcePath: z
    .string()
    .trim()
    .min(1, "Source path is required")
    .max(REDIRECT_SOURCE_PATH_MAX_LENGTH, "Source path is too long")
    .regex(REDIRECT_PATH_REGEX, "Must start with / and contain no spaces"),
  targetPath: z
    .string()
    .trim()
    .min(1, "Target path is required")
    .max(REDIRECT_TARGET_PATH_MAX_LENGTH, "Target path is too long")
    .regex(REDIRECT_PATH_REGEX, "Must start with / and contain no spaces"),
});

export type InternalRedirectValues = z.infer<typeof internalRedirectSchema>;
