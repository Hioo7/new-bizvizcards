import type { ProductType } from "@app-types/product.types";

export const PRODUCT_LIST_PAGE_SIZE = 20;
export const PRODUCT_SEARCH_DEBOUNCE_MS = 300;
export const PRODUCT_UNIT_LIST_PAGE_SIZE = 50;

// Mirrors backend PRODUCT_MEDIA_GALLERY_MAX_PER_SCOPE (products.constants.ts).
export const PRODUCT_GALLERY_MAX_IMAGES = 30;

// Mirrors backend PRODUCT_UNIT_GENERATE_MAX_QUANTITY / PRINT_BATCH_MAX_QUANTITY.
export const PRODUCT_UNIT_QUANTITY_MAX = 5000;

// Mirrors backend PRODUCT_PRICE_MAX (products.constants.ts).
export const PRODUCT_PRICE_MAX = 1_000_000;

export const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: "STANDALONE", label: "Standalone (single item, no variants)" },
  { value: "VARIANT_BASED", label: "Has variants (e.g. color, size)" },
];

export function productTypeLabel(productType: ProductType): string {
  return productType === "STANDALONE" ? "Standalone" : "Has variants";
}
