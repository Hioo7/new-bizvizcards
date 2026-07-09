import { z } from "zod";
import { STAFF_NAME_MAX_LENGTH } from "@features/staff-management/config";

export const createStaffSchema = z.object({
  email: z.email("Please enter a valid email address"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(STAFF_NAME_MAX_LENGTH, "Name is too long"),
  role: z.enum(["employee", "admin"]),
});

export type CreateStaffValues = z.infer<typeof createStaffSchema>;
