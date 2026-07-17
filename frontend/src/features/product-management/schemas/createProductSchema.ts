import { z } from "zod";
import { PRODUCT_PRICE_MAX } from "@features/product-management/config/productManagement.config";

// price is required for STANDALONE and forbidden for VARIANT_BASED (each
// variant is priced independently instead) — mirrors ProductsService's
// assertPriceMatchesProductType on the backend. The price field is only
// rendered (and registered) when productType is STANDALONE; the submit
// handler strips it entirely otherwise.
export const createProductSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
    description: z
      .string()
      .trim()
      .max(2000, "Description is too long")
      .optional()
      .or(z.literal("")),
    productType: z.enum(["STANDALONE", "VARIANT_BASED"]),
    price: z.number().min(0).max(PRODUCT_PRICE_MAX).optional(),
  })
  .refine(
    (value) => value.productType !== "STANDALONE" || value.price !== undefined,
    { message: "Price is required", path: ["price"] },
  );

export type CreateProductValues = z.infer<typeof createProductSchema>;
