import {
  ADMIN_PRODUCTS_BASE_PATH,
  ADMIN_PRODUCT_UNITS_BASE_PATH,
} from "@config/api";
import { PRODUCT_MEDIA_FILE_FIELD } from "@config/productFields";
import { apiRequest } from "@services/apiClient";
import type {
  CreatePrintBatchPayload,
  CreateProductPayload,
  CreateProductVariantPayload,
  GenerateProductUnitsPayload,
  ListProductsQuery,
  PrintBatchResult,
  Product,
  ProductListResponse,
  ProductMediaPurpose,
  ProductUnit,
  ProductUnitListResponse,
  UpdateProductPayload,
  UpdateProductVariantPayload,
} from "@app-types/product.types";

export function listProducts(
  query: ListProductsQuery,
): Promise<ProductListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.productType) params.set("productType", query.productType);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiRequest<ProductListResponse>(
    `${ADMIN_PRODUCTS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function getProduct(id: string): Promise<Product> {
  return apiRequest<Product>(`${ADMIN_PRODUCTS_BASE_PATH}/${id}`, {
    method: "GET",
  });
}

export function createProduct(payload: CreateProductPayload): Promise<Product> {
  return apiRequest<Product>(ADMIN_PRODUCTS_BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  return apiRequest<Product>(`${ADMIN_PRODUCTS_BASE_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return apiRequest<void>(`${ADMIN_PRODUCTS_BASE_PATH}/${id}`, {
    method: "DELETE",
  });
}

export function createProductVariant(
  productId: string,
  payload: CreateProductVariantPayload,
): Promise<Product> {
  return apiRequest<Product>(
    `${ADMIN_PRODUCTS_BASE_PATH}/${productId}/variants`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateProductVariant(
  variantId: string,
  payload: UpdateProductVariantPayload,
): Promise<Product> {
  return apiRequest<Product>(
    `${ADMIN_PRODUCTS_BASE_PATH}/variants/${variantId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function removeProductVariant(variantId: string): Promise<Product> {
  return apiRequest<Product>(
    `${ADMIN_PRODUCTS_BASE_PATH}/variants/${variantId}`,
    { method: "DELETE" },
  );
}

function buildMediaFormData(
  file: File,
  purpose: ProductMediaPurpose,
  sortOrder?: number,
): FormData {
  const formData = new FormData();
  formData.set("purpose", purpose);
  if (sortOrder !== undefined) formData.set("sortOrder", String(sortOrder));
  formData.set(PRODUCT_MEDIA_FILE_FIELD, file);
  return formData;
}

export function addProductMedia(
  productId: string,
  file: File,
  purpose: ProductMediaPurpose,
  sortOrder?: number,
): Promise<Product> {
  return apiRequest<Product>(`${ADMIN_PRODUCTS_BASE_PATH}/${productId}/media`, {
    method: "POST",
    body: buildMediaFormData(file, purpose, sortOrder),
  });
}

export function addVariantMedia(
  variantId: string,
  file: File,
  purpose: ProductMediaPurpose,
  sortOrder?: number,
): Promise<Product> {
  return apiRequest<Product>(
    `${ADMIN_PRODUCTS_BASE_PATH}/variants/${variantId}/media`,
    { method: "POST", body: buildMediaFormData(file, purpose, sortOrder) },
  );
}

export function removeProductMedia(productMediaId: string): Promise<Product> {
  return apiRequest<Product>(
    `${ADMIN_PRODUCTS_BASE_PATH}/media/${productMediaId}`,
    { method: "DELETE" },
  );
}

export function generateUnitsForProduct(
  productId: string,
  payload: GenerateProductUnitsPayload,
): Promise<ProductUnitListResponse> {
  return apiRequest<ProductUnitListResponse>(
    `${ADMIN_PRODUCT_UNITS_BASE_PATH}/generate/product/${productId}`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function generateUnitsForVariant(
  variantId: string,
  payload: GenerateProductUnitsPayload,
): Promise<ProductUnitListResponse> {
  return apiRequest<ProductUnitListResponse>(
    `${ADMIN_PRODUCT_UNITS_BASE_PATH}/generate/variant/${variantId}`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function listProductUnits(query: {
  productId?: string;
  variantId?: string;
  printed?: boolean;
  linked?: boolean;
  page: number;
  pageSize: number;
}): Promise<ProductUnitListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.productId) params.set("productId", query.productId);
  if (query.variantId) params.set("variantId", query.variantId);
  if (query.printed !== undefined) params.set("printed", String(query.printed));
  if (query.linked !== undefined) params.set("linked", String(query.linked));

  return apiRequest<ProductUnitListResponse>(
    `${ADMIN_PRODUCT_UNITS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function createPrintBatch(
  payload: CreatePrintBatchPayload,
): Promise<PrintBatchResult> {
  return apiRequest<PrintBatchResult>(
    `${ADMIN_PRODUCT_UNITS_BASE_PATH}/print-batch`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updatePrintStatus(
  unitId: string,
  printed: boolean,
): Promise<ProductUnit> {
  return apiRequest<ProductUnit>(
    `${ADMIN_PRODUCT_UNITS_BASE_PATH}/${unitId}/print-status`,
    { method: "PATCH", body: JSON.stringify({ printed }) },
  );
}
