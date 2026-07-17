import { Plus } from "lucide-react";
import type { ProductType } from "@app-types/product.types";

const TYPE_FILTER_OPTIONS: { label: string; value: ProductType | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Standalone", value: "STANDALONE" },
  { label: "Has variants", value: "VARIANT_BASED" },
];

const ACTIVE_FILTER_OPTIONS: { label: string; value: boolean | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

interface ProductToolbarProps {
  productTypeFilter: ProductType | undefined;
  onProductTypeFilterChange: (value: ProductType | undefined) => void;
  isActiveFilter: boolean | undefined;
  onIsActiveFilterChange: (value: boolean | undefined) => void;
  onAddProduct: () => void;
}

export default function ProductToolbar({
  productTypeFilter,
  onProductTypeFilterChange,
  isActiveFilter,
  onIsActiveFilterChange,
  onAddProduct,
}: ProductToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex overflow-hidden rounded-field border border-base-300">
          {TYPE_FILTER_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onProductTypeFilterChange(option.value)}
              className={`min-h-11 flex-1 border-base-300 px-4 text-xs font-semibold transition-colors ${
                index > 0 ? "border-l" : ""
              } ${
                productTypeFilter === option.value
                  ? "bg-primary text-primary-content"
                  : "bg-base-100 text-base-content/70 hover:bg-base-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex overflow-hidden rounded-field border border-base-300">
          {ACTIVE_FILTER_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onIsActiveFilterChange(option.value)}
              className={`min-h-11 flex-1 border-base-300 px-4 text-xs font-semibold transition-colors ${
                index > 0 ? "border-l" : ""
              } ${
                isActiveFilter === option.value
                  ? "bg-primary text-primary-content"
                  : "bg-base-100 text-base-content/70 hover:bg-base-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Add product"
        onClick={onAddProduct}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
