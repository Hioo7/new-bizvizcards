import { z } from "zod";
import { PRODUCT_UNIT_QUANTITY_MAX } from "@features/product-management/config/productManagement.config";

// Plain z.number() (not z.coerce) paired with registering the input via
// { valueAsNumber: true } — coerce makes the resolver's input/output types
// diverge (string vs number), which react-hook-form's generic Resolver type
// can't reconcile without threading a separate input-type generic through
// every form here.
export const unitQuantitySchema = z.object({
  quantity: z
    .number()
    .int("Enter a whole number")
    .min(1, "Enter at least 1")
    .max(PRODUCT_UNIT_QUANTITY_MAX, `Enter at most ${PRODUCT_UNIT_QUANTITY_MAX}`),
});

export type UnitQuantityValues = z.infer<typeof unitQuantitySchema>;
