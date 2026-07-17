export type ProductType = "STANDALONE" | "VARIANT_BASED";
export type ProductMediaPurpose = "GALLERY" | "PREVIEW";
export type LinkedCardType = "ECARD" | "SMART_CARD";

export interface ProductMediaEntry {
  id: string;
  mediaId: string;
  purpose: ProductMediaPurpose;
  sortOrder: number;
  url: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  media: ProductMediaEntry[];
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  productType: ProductType;
  price: number | null;
  isActive: boolean;
  createdByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  media: ProductMediaEntry[];
  variants: ProductVariant[];
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductUnit {
  id: string;
  productId: string | null;
  variantId: string | null;
  code: string;
  url: string;
  printedAt: string | null;
  printBatchId: string | null;
  provisionedAt: string;
  isLinked: boolean;
}

export interface ProductUnitListResponse {
  units: ProductUnit[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PrintBatchResult {
  printBatchId: string;
  units: ProductUnit[];
}

export interface ListProductsQuery {
  productType?: ProductType;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  productType: ProductType;
  price?: number;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  price?: number;
}

export interface CreateProductVariantPayload {
  name: string;
  sku: string;
  price: number;
}

export interface UpdateProductVariantPayload {
  name?: string;
  sku?: string;
  price?: number;
}

export interface GenerateProductUnitsPayload {
  quantity: number;
}

export interface CreatePrintBatchPayload {
  productId?: string;
  variantId?: string;
  quantity: number;
}
