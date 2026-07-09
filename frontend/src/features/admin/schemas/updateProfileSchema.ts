import { z } from "zod";
import { PROFILE_NAME_MAX_LENGTH } from "@features/admin/config";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(PROFILE_NAME_MAX_LENGTH, "Name is too long"),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
