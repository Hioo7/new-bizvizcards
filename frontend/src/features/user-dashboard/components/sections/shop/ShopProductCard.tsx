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

  function handleTap() {
    if (isVariant) {
      onSelectVariant(product);
    } else {
      onAddStandalone(product.id);
    }
  }

  return (
    <button
      className="text-left w-full active:scale-95 transition-transform disabled:opacity-60 disabled:scale-100"
      onClick={handleTap}
      disabled={adding}
      aria-label={`${product.name} — ${isVariant ? "choose variant" : "add to cart"}`}
    >
      {/* White image box */}
      <div className="relative w-full aspect-square bg-base-100 rounded-2xl overflow-hidden flex items-center justify-center">
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

        {/* Loading spinner overlay */}
        {adding && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
            <span className="loading loading-spinner loading-md text-white" />
          </div>
        )}
      </div>

      {/* Name + price below the card */}
      <div className="mt-2 px-0.5">
        <p className="text-sm font-semibold text-base-content leading-snug line-clamp-2">
          {product.name}
        </p>
        <p className="text-sm text-base-content/70 mt-0.5">
          {displayPrice !== null
            ? `${isVariant ? "from " : ""}$${displayPrice.toFixed(2)}`
            : "Price varies"}
        </p>
      </div>
    </button>
  );
}
