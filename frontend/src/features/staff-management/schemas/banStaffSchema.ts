import { z } from "zod";
import { STAFF_BAN_REASON_MAX_LENGTH } from "@features/staff-management/config";

export const banStaffSchema = z.object({
  banReason: z
    .string()
    .trim()
    .max(STAFF_BAN_REASON_MAX_LENGTH, "Reason is too long")
    .optional(),
});

export type BanStaffValues = z.infer<typeof banStaffSchema>;
