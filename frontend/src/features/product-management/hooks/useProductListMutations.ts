import { useMemo } from "react";
import { createProduct, deleteProduct } from "@services/productService";
import type { CreateProductPayload, Product } from "@app-types/product.types";

export interface UseProductListMutationsResult {
  createProduct: (payload: CreateProductPayload) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

export function useProductListMutations(
  refetch: () => void,
): UseProductListMutationsResult {
  return useMemo(
    () => ({
      createProduct: async (payload) => {
        const product = await createProduct(payload);
        refetch();
        return product;
      },
      deleteProduct: async (id) => {
        await deleteProduct(id);
        refetch();
      },
    }),
    [refetch],
  );
}
