import { z } from "zod";
import {
  REDIRECT_DESTINATION_URL_MAX_LENGTH,
  REDIRECT_PATH_REGEX,
  REDIRECT_SOURCE_PATH_MAX_LENGTH,
} from "@features/redirects/config";

export const externalRedirectSchema = z.object({
  sourcePath: z
    .string()
    .trim()
    .min(1, "Source path is required")
    .max(REDIRECT_SOURCE_PATH_MAX_LENGTH, "Source path is too long")
    .regex(REDIRECT_PATH_REGEX, "Must start with / and contain no spaces"),
  destinationUrl: z
    .url("Please enter a valid http(s) URL")
    .max(REDIRECT_DESTINATION_URL_MAX_LENGTH, "URL is too long")
    .refine(
      (value) => value.startsWith("http://") || value.startsWith("https://"),
      "Must start with http:// or https://",
    ),
});

export type ExternalRedirectValues = z.infer<typeof externalRedirectSchema>;
