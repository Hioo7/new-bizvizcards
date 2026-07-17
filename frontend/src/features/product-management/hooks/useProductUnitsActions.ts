import { useMemo } from "react";
import {
  createPrintBatch,
  generateUnitsForProduct,
  generateUnitsForVariant,
} from "@services/productService";
import type {
  CreatePrintBatchPayload,
  PrintBatchResult,
} from "@app-types/product.types";

export interface UseProductUnitsActionsResult {
  generateUnits: (quantity: number) => Promise<void>;
  createPrintBatch: (payload: CreatePrintBatchPayload) => Promise<PrintBatchResult>;
}

interface ProductUnitsScope {
  productId?: string;
  variantId?: string;
}

export function useProductUnitsActions(
  { productId, variantId }: ProductUnitsScope,
  refetchSummary: () => void,
): UseProductUnitsActionsResult {
  return useMemo(
    () => ({
      generateUnits: async (quantity) => {
        if (productId) {
          await generateUnitsForProduct(productId, { quantity });
        } else if (variantId) {
          await generateUnitsForVariant(variantId, { quantity });
        }
        refetchSummary();
      },
      createPrintBatch: async (payload) => {
        const result = await createPrintBatch(payload);
        refetchSummary();
        return result;
      },
    }),
    [productId, variantId, refetchSummary],
  );
}
