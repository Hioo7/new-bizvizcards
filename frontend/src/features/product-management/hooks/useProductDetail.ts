import { useCallback, useEffect, useState } from "react";
import { getProduct } from "@services/productService";
import type { Product } from "@app-types/product.types";

export interface UseProductDetailResult {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProductDetail(productId: string): UseProductDetailResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getProduct(productId);
        if (cancelled) return;
        setProduct(result);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load product.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [productId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { product, isLoading, error, refetch };
}
