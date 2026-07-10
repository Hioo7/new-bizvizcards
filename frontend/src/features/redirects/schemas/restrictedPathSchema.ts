import { z } from "zod";
import {
  REDIRECT_PATH_REGEX,
  REDIRECT_RESTRICTED_PATH_MAX_LENGTH,
} from "@features/redirects/config";

export const restrictedPathSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, "Path is required")
    .max(REDIRECT_RESTRICTED_PATH_MAX_LENGTH, "Path is too long")
    .regex(REDIRECT_PATH_REGEX, "Must start with / and contain no spaces"),
});

export type RestrictedPathValues = z.infer<typeof restrictedPathSchema>;
