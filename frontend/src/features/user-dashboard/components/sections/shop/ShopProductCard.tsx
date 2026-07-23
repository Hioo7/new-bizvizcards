import { useState } from "react";
import type { ShopProduct } from "@features/user-dashboard/types";

interface Props {
  product: ShopProduct;
  onAddStandalone: (productId: string) => void;
  onSelectVariant: (product: ShopProduct) => void;
  adding: boolean;
}

function findPreviewUrl(product: ShopProduct): string | null {
  const preview = product.media.find((m) => m.purpose === "PREVIEW");
  return preview?.url ?? null;
}

function lowestVariantPrice(product: ShopProduct): number | null {
  if (product.variants.length === 0) return null;
  return Math.min(...product.variants.map((v) => v.price));
}

export default function ShopProductCard({
  product,
  onAddStandalone,
  onSelectVariant,
  adding,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const previewUrl = findPreviewUrl(product);
  const isVariant = product.productType === "VARIANT_BASED";
  const displayPrice = isVariant ? lowestVariantPrice(product) : product.price;

  function handleAdd() {
    if (isVariant) {
      onSelectVariant(product);
    } else {
      onAddStandalone(product.id);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Image area */}
      <div className="relative w-full aspect-square bg-base-100 rounded-2xl overflow-hidden flex items-center justify-center border border-base-200">
        {previewUrl && !imgError ? (
          <img
            src={previewUrl}
            alt={product.name}
            className="object-contain w-full h-full p-2"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10 text-base-content/30"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
            />
          </svg>
        )}

        {/* Loading spinner overlay while adding */}
        {adding && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
            <span className="loading loading-spinner loading-md text-white" />
          </div>
        )}
      </div>

      {/* Name + price */}
      <div className="px-0.5">
        <p className="text-sm font-semibold text-base-content leading-snug line-clamp-2">
          {product.name}
        </p>
        <p className="text-xs text-base-content/60 mt-0.5">
          {displayPrice !== null
            ? `${isVariant ? "from " : ""}₹${displayPrice.toFixed(2)}`
            : "Price varies"}
        </p>
      </div>

      {/* Add to Cart button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        aria-label={`${product.name} — ${isVariant ? "choose options" : "add to cart"}`}
        className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 active:bg-primary/30 disabled:opacity-50 transition-colors"
      >
        {adding ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
        {isVariant ? "Choose options" : "Add to cart"}
      </button>
    </div>
  );
}
