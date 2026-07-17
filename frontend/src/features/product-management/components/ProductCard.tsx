import { Trash2 } from "lucide-react";
import type { Product } from "@app-types/product.types";
import ProductTypeBadge from "@features/product-management/components/ProductTypeBadge";
import ProductActiveBadge from "@features/product-management/components/ProductActiveBadge";

interface ProductCardProps {
  product: Product;
  onOpen: () => void;
  onDelete: () => void;
}

export default function ProductCard({ product, onOpen, onDelete }: ProductCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="flex w-full cursor-pointer flex-col rounded-box border border-base-300 bg-base-100 p-4 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-base-content">{product.name}</p>
          {product.productType === "VARIANT_BASED" ? (
            <p className="text-xs text-base-content/60">
              {product.variants.length}{" "}
              {product.variants.length === 1 ? "variant" : "variants"}
            </p>
          ) : (
            product.price !== null && (
              <p className="text-xs text-base-content/60">₹{product.price}</p>
            )
          )}
        </div>
        <button
          type="button"
          aria-label={`Delete ${product.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ProductTypeBadge productType={product.productType} />
        <ProductActiveBadge isActive={product.isActive} />
      </div>
    </div>
  );
}
