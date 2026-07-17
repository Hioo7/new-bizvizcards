import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import Pagination from "@components/Pagination";
import ConfirmActionModal from "@components/ConfirmActionModal";
import { adminProductDetailPath } from "@config/routes";
import type { Product } from "@app-types/product.types";
import { useProductList } from "@features/product-management/hooks/useProductList";
import { useProductListMutations } from "@features/product-management/hooks/useProductListMutations";
import ProductToolbar from "@features/product-management/components/ProductToolbar";
import ProductTable from "@features/product-management/components/ProductTable";
import CreateProductModal from "@features/product-management/components/CreateProductModal";
import type { CreateProductValues } from "@features/product-management/schemas/createProductSchema";

export default function ProductManagementApp() {
  const navigate = useNavigate();
  const list = useProductList();
  const mutations = useProductListMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const createAction = useAsyncAction();
  const deleteAction = useAsyncAction();

  const handleCreateSubmit = (values: CreateProductValues) => {
    void createAction.run(
      async () => {
        const product = await mutations.createProduct({
          name: values.name,
          description: values.description || undefined,
          productType: values.productType,
        });
        navigate(adminProductDetailPath(product.id));
      },
      () => setIsCreateOpen(false),
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingProduct) return;
    void deleteAction.run(
      () => mutations.deleteProduct(deletingProduct.id),
      () => setDeletingProduct(null),
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">Products</h1>
        <p className="text-sm text-base-content/60">
          {list.total} {list.total === 1 ? "product" : "products"}
        </p>
      </div>

      <ProductToolbar
        productTypeFilter={list.productTypeFilter}
        onProductTypeFilterChange={list.setProductTypeFilter}
        isActiveFilter={list.isActiveFilter}
        onIsActiveFilterChange={list.setIsActiveFilter}
        onAddProduct={() => {
          createAction.reset();
          setIsCreateOpen(true);
        }}
      />

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        <ProductTable
          products={list.products}
          isLoading={list.isLoading}
          error={list.error}
          hasActiveFilters={Boolean(
            list.productTypeFilter || list.isActiveFilter !== undefined,
          )}
          onOpen={(product) => navigate(adminProductDetailPath(product.id))}
          onDelete={(product) => {
            deleteAction.reset();
            setDeletingProduct(product);
          }}
        />
      </div>

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
      />

      <CreateProductModal
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <ConfirmActionModal
        open={deletingProduct !== null}
        icon={Trash2}
        title={`Delete ${deletingProduct?.name}?`}
        description="This permanently removes the product. Products with provisioned physical units can't be deleted."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
