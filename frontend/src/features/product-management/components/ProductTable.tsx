import { Package } from "lucide-react";
import type { Product } from "@app-types/product.types";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import ProductRow from "@features/product-management/components/ProductRow";
import ProductCard from "@features/product-management/components/ProductCard";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onOpen: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductTable({
  products,
  isLoading,
  error,
  hasActiveFilters,
  onOpen,
  onDelete,
}: ProductTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Package className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          {hasActiveFilters ? "No products match your filters." : "No products yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
            <th className="py-2 pl-4 pr-3 font-semibold">Product</th>
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="py-2 pl-3 pr-4 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onOpen={() => onOpen(product)}
              onDelete={() => onDelete(product)}
            />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => onOpen(product)}
            onDelete={() => onDelete(product)}
          />
        ))}
      </div>
    </>
  );
}
