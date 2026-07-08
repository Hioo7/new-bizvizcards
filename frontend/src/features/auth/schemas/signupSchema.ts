import { z } from "zod";
import { MIN_NAME_LENGTH, MIN_PASSWORD_LENGTH } from "@features/auth/config";

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(
        MIN_NAME_LENGTH,
        `Please enter your full name (min ${MIN_NAME_LENGTH} characters)`,
      ),
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      ),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
