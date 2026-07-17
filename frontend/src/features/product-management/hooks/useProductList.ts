import { useCallback, useEffect, useState } from "react";
import { listProducts } from "@services/productService";
import type { Product, ProductType } from "@app-types/product.types";
import { PRODUCT_LIST_PAGE_SIZE } from "@features/product-management/config/productManagement.config";

export interface UseProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  productTypeFilter: ProductType | undefined;
  isActiveFilter: boolean | undefined;
  isLoading: boolean;
  error: string | null;
  setProductTypeFilter: (value: ProductType | undefined) => void;
  setIsActiveFilter: (value: boolean | undefined) => void;
  setPage: (value: number) => void;
  refetch: () => void;
}

export function useProductList(): UseProductListResult {
  const [productTypeFilter, setProductTypeFilterState] = useState<
    ProductType | undefined
  >(undefined);
  const [isActiveFilter, setIsActiveFilterState] = useState<
    boolean | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listProducts({
          productType: productTypeFilter,
          isActive: isActiveFilter,
          page,
          pageSize: PRODUCT_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setProducts(response.products);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load products.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [productTypeFilter, isActiveFilter, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  const setProductTypeFilter = useCallback((value: ProductType | undefined) => {
    setProductTypeFilterState(value);
    setPage(1);
  }, []);

  const setIsActiveFilter = useCallback((value: boolean | undefined) => {
    setIsActiveFilterState(value);
    setPage(1);
  }, []);

  return {
    products,
    total,
    page,
    pageSize: PRODUCT_LIST_PAGE_SIZE,
    productTypeFilter,
    isActiveFilter,
    isLoading,
    error,
    setProductTypeFilter,
    setIsActiveFilter,
    setPage,
    refetch,
  };
}
