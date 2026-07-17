import { z } from "zod";
import { PRODUCT_PRICE_MAX } from "@features/product-management/config/productManagement.config";

export const productVariantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  sku: z.string().trim().min(1, "SKU is required").max(64, "SKU is too long"),
  price: z.number().min(0, "Price is required").max(PRODUCT_PRICE_MAX),
});

export type ProductVariantValues = z.infer<typeof productVariantSchema>;
