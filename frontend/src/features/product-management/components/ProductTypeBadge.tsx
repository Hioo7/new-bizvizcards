import { Layers, Package } from "lucide-react";
import type { ProductType } from "@app-types/product.types";
import { productTypeLabel } from "@features/product-management/config/productManagement.config";

interface ProductTypeBadgeProps {
  productType: ProductType;
}

export default function ProductTypeBadge({ productType }: ProductTypeBadgeProps) {
  const Icon = productType === "STANDALONE" ? Package : Layers;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-field bg-base-200 px-2.5 py-1 text-xs font-semibold text-base-content/70">
      <Icon className="h-3.5 w-3.5" />
      {productTypeLabel(productType)}
    </span>
  );
}
