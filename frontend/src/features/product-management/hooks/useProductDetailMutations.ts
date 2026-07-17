import { useMemo } from "react";
import {
  addProductMedia,
  addVariantMedia,
  createProductVariant,
  deleteProduct,
  removeProductMedia,
  removeProductVariant,
  updateProduct,
  updateProductVariant,
} from "@services/productService";
import type {
  CreateProductVariantPayload,
  ProductMediaPurpose,
  UpdateProductPayload,
  UpdateProductVariantPayload,
} from "@app-types/product.types";

export interface UseProductDetailMutationsResult {
  updateProduct: (id: string, payload: UpdateProductPayload) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createVariant: (
    productId: string,
    payload: CreateProductVariantPayload,
  ) => Promise<void>;
  updateVariant: (
    variantId: string,
    payload: UpdateProductVariantPayload,
  ) => Promise<void>;
  removeVariant: (variantId: string) => Promise<void>;
  addProductMedia: (
    productId: string,
    file: File,
    purpose: ProductMediaPurpose,
  ) => Promise<void>;
  addVariantMedia: (
    variantId: string,
    file: File,
    purpose: ProductMediaPurpose,
  ) => Promise<void>;
  removeMedia: (productMediaId: string) => Promise<void>;
}

export function useProductDetailMutations(
  refetch: () => void,
): UseProductDetailMutationsResult {
  return useMemo(
    () => ({
      updateProduct: async (id, payload) => {
        await updateProduct(id, payload);
        refetch();
      },
      // Not followed by refetch: the caller navigates away on success since
      // this page's product no longer exists.
      deleteProduct: async (id) => {
        await deleteProduct(id);
      },
      createVariant: async (productId, payload) => {
        await createProductVariant(productId, payload);
        refetch();
      },
      updateVariant: async (variantId, payload) => {
        await updateProductVariant(variantId, payload);
        refetch();
      },
      removeVariant: async (variantId) => {
        await removeProductVariant(variantId);
        refetch();
      },
      addProductMedia: async (productId, file, purpose) => {
        await addProductMedia(productId, file, purpose);
        refetch();
      },
      addVariantMedia: async (variantId, file, purpose) => {
        await addVariantMedia(variantId, file, purpose);
        refetch();
      },
      removeMedia: async (productMediaId) => {
        await removeProductMedia(productMediaId);
        refetch();
      },
    }),
    [refetch],
  );
}
