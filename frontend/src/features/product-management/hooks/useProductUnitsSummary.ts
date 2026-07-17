import { useCallback, useEffect, useState } from "react";
import { listProductUnits } from "@services/productService";

export interface ProductUnitsSummary {
  total: number;
  unprinted: number;
  printed: number;
  linked: number;
  unlinked: number;
}

export interface UseProductUnitsSummaryResult {
  summary: ProductUnitsSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Exactly one of productId/variantId is provided by the caller. */
interface ProductUnitsScope {
  productId?: string;
  variantId?: string;
}

// Backend always returns `total` for the matching filter regardless of
// pageSize, so a pageSize of 1 gets each count without transferring every
// unit's data — cheap enough to run three of these in parallel.
export function useProductUnitsSummary({
  productId,
  variantId,
}: ProductUnitsScope): UseProductUnitsSummaryResult {
  const [summary, setSummary] = useState<ProductUnitsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      setIsLoading(true);
      setError(null);
      try {
        const scope = { productId, variantId };
        const [all, unprinted, linked] = await Promise.all([
          listProductUnits({ ...scope, page: 1, pageSize: 1 }),
          listProductUnits({ ...scope, printed: false, page: 1, pageSize: 1 }),
          listProductUnits({ ...scope, linked: true, page: 1, pageSize: 1 }),
        ]);
        if (cancelled) return;
        setSummary({
          total: all.total,
          unprinted: unprinted.total,
          printed: all.total - unprinted.total,
          linked: linked.total,
          unlinked: all.total - linked.total,
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load unit counts.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [productId, variantId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { summary, isLoading, error, refetch };
}
