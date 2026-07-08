import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name"),
  email: z.email("Please enter a valid email address"),
  contact: z.string().trim().min(1, "Please enter a contact number"),
  message: z.string().trim().min(1, "Please enter a message"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
