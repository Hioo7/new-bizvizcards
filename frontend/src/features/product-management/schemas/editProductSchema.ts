import { z } from "zod";
import { PRODUCT_PRICE_MAX } from "@features/product-management/config/productManagement.config";

// price is only present/editable for a STANDALONE product — the edit sheet
// only renders it in that case, mirroring createProductSchema.
export const editProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional()
    .or(z.literal("")),
  price: z.number().min(0).max(PRODUCT_PRICE_MAX).optional(),
});

export type EditProductValues = z.infer<typeof editProductSchema>;
