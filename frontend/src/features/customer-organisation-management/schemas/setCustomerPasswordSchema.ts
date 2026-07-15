import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@config/password.config";

export const setCustomerPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    ),
});

export type SetCustomerPasswordValues = z.infer<
  typeof setCustomerPasswordSchema
>;
