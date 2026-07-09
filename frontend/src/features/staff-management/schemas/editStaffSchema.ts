import { z } from "zod";
import { STAFF_NAME_MAX_LENGTH } from "@features/staff-management/config";

export const editStaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(STAFF_NAME_MAX_LENGTH, "Name is too long"),
  role: z.enum(["employee", "admin"]).optional(),
});

export type EditStaffValues = z.infer<typeof editStaffSchema>;
