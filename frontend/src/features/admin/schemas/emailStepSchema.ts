import { z } from "zod";

export const emailStepSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export type EmailStepValues = z.infer<typeof emailStepSchema>;
