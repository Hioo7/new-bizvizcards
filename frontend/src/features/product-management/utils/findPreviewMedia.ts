import type { ProductMediaEntry } from "@app-types/product.types";

export function findPreviewMediaUrl(media: ProductMediaEntry[]): string | null {
  return media.find((entry) => entry.purpose === "PREVIEW")?.url ?? null;
}
