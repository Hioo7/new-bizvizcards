import { Trash2 } from "lucide-react";
import type { Product } from "@app-types/product.types";
import ProductTypeBadge from "@features/product-management/components/ProductTypeBadge";
import ProductActiveBadge from "@features/product-management/components/ProductActiveBadge";

interface ProductRowProps {
  product: Product;
  onOpen: () => void;
  onDelete: () => void;
}

export default function ProductRow({ product, onOpen, onDelete }: ProductRowProps) {
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-base-300 last:border-b-0 hover:bg-base-200/50"
    >
      <td className="py-3 pl-4 pr-3">
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
      </td>
      <td className="px-3 py-3">
        <ProductTypeBadge productType={product.productType} />
      </td>
      <td className="px-3 py-3">
        <ProductActiveBadge isActive={product.isActive} />
      </td>
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center justify-end">
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
      </td>
    </tr>
  );
}
