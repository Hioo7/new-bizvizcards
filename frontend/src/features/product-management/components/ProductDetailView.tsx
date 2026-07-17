import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Images, Layers, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import ConfirmActionModal from "@components/ConfirmActionModal";
import { ROUTES } from "@config/routes";
import type { ProductVariant } from "@app-types/product.types";
import { useProductDetail } from "@features/product-management/hooks/useProductDetail";
import { useProductDetailMutations } from "@features/product-management/hooks/useProductDetailMutations";
import ProductTypeBadge from "@features/product-management/components/ProductTypeBadge";
import ProductActiveBadge from "@features/product-management/components/ProductActiveBadge";
import MediaThumbnail from "@features/product-management/components/MediaThumbnail";
import ProductMediaSection from "@features/product-management/components/ProductMediaSection";
import ProductUnitsPanel from "@features/product-management/components/ProductUnitsPanel";
import EditProductModal from "@features/product-management/components/EditProductModal";
import CreateVariantModal from "@features/product-management/components/CreateVariantModal";
import EditVariantModal from "@features/product-management/components/EditVariantModal";
import VariantRow from "@features/product-management/components/VariantRow";
import VariantManageSheet from "@features/product-management/components/VariantManageSheet";
import { findPreviewMediaUrl } from "@features/product-management/utils/findPreviewMedia";
import type { EditProductValues } from "@features/product-management/schemas/editProductSchema";
import type { ProductVariantValues } from "@features/product-management/schemas/productVariantSchema";

export default function ProductDetailView() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const detail = useProductDetail(productId ?? "");
  const mutations = useProductDetailMutations(detail.refetch);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateVariantOpen, setIsCreateVariantOpen] = useState(false);
  const [managingVariantId, setManagingVariantId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<ProductVariant | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const editAction = useAsyncAction();
  const toggleActiveAction = useAsyncAction();
  const createVariantAction = useAsyncAction();
  const editVariantAction = useAsyncAction();
  const deleteVariantAction = useAsyncAction();
  const deleteProductAction = useAsyncAction();

  if (!productId) return null;

  const handleEditSubmit = (values: EditProductValues) => {
    void editAction.run(
      () =>
        mutations.updateProduct(productId, {
          name: values.name,
          description: values.description || undefined,
          ...(detail.product?.productType === "STANDALONE" && {
            price: values.price,
          }),
        }),
      () => setIsEditOpen(false),
    );
  };

  const handleToggleActive = () => {
    if (!detail.product) return;
    void toggleActiveAction.run(
      () => mutations.updateProduct(productId, { isActive: !detail.product!.isActive }),
      () => undefined,
    );
  };

  const handleCreateVariantSubmit = (values: ProductVariantValues) => {
    void createVariantAction.run(
      () => mutations.createVariant(productId, values),
      () => setIsCreateVariantOpen(false),
    );
  };

  const handleEditVariantSubmit = (values: ProductVariantValues) => {
    if (!editingVariant) return;
    void editVariantAction.run(
      () => mutations.updateVariant(editingVariant.id, values),
      () => setEditingVariant(null),
    );
  };

  const handleDeleteVariantConfirm = () => {
    if (!deletingVariant) return;
    void deleteVariantAction.run(
      () => mutations.removeVariant(deletingVariant.id),
      () => setDeletingVariant(null),
    );
  };

  const handleDeleteProductConfirm = () => {
    void deleteProductAction.run(
      () => mutations.deleteProduct(productId),
      () => navigate(ROUTES.adminProducts),
    );
  };

  if (detail.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (detail.error || !detail.product) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.adminProducts)}
          className="flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <FormErrorRibbon message={detail.error ?? "Product not found."} />
      </div>
    );
  }

  const { product } = detail;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(ROUTES.adminProducts)}
        className="flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </button>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <MediaThumbnail
            previewUrl={findPreviewMediaUrl(product.media)}
            fallbackIcon={Package}
            size="md"
          />
          <h1 className="text-2xl font-extrabold text-base-content">{product.name}</h1>
          <button
            type="button"
            aria-label="Edit product"
            onClick={() => {
              editAction.reset();
              setIsEditOpen(true);
            }}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Delete product"
          onClick={() => {
            deleteProductAction.reset();
            setIsDeletingProduct(true);
          }}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {product.description && (
        <p className="text-sm text-base-content/70">{product.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <ProductTypeBadge productType={product.productType} />
        {product.productType === "STANDALONE" && product.price !== null && (
          <span className="rounded-field bg-base-200 px-2.5 py-1 text-xs font-semibold text-base-content/70">
            ₹{product.price}
          </span>
        )}
        <button
          type="button"
          disabled={toggleActiveAction.isSubmitting}
          onClick={handleToggleActive}
          aria-label={product.isActive ? "Mark as inactive" : "Mark as active"}
        >
          <ProductActiveBadge isActive={product.isActive} />
        </button>
      </div>
      {toggleActiveAction.error && <FormErrorRibbon message={toggleActiveAction.error} />}

      {product.productType === "STANDALONE" ? (
        <>
          <section className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
              <Images className="h-3.5 w-3.5" />
              Media
            </p>
            <ProductMediaSection
              media={product.media}
              onAddMedia={(file, purpose) =>
                mutations.addProductMedia(product.id, file, purpose)
              }
              onRemoveMedia={mutations.removeMedia}
            />
          </section>
          <section className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
              <Package className="h-3.5 w-3.5" />
              Physical units
            </p>
            <ProductUnitsPanel productId={product.id} />
          </section>
        </>
      ) : (
        <>
          <section className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
                <Images className="h-3.5 w-3.5" />
                Product media
              </p>
              <p className="mt-1 text-xs text-base-content/50">
                Used as the connect-popup preview for any variant that doesn&apos;t
                have its own.
              </p>
            </div>
            <ProductMediaSection
              media={product.media}
              onAddMedia={(file, purpose) =>
                mutations.addProductMedia(product.id, file, purpose)
              }
              onRemoveMedia={mutations.removeMedia}
            />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-base-content/70">
                <Layers className="h-4 w-4" />
                Variants ({product.variants.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  createVariantAction.reset();
                  setIsCreateVariantOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-field border border-base-300 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
              >
                <Plus className="h-4 w-4" />
                Add variant
              </button>
            </div>

            {product.variants.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-box border border-dashed border-base-300 py-16 text-center">
                <Layers className="h-8 w-8 text-base-content/30" />
                <p className="text-sm text-base-content/60">No variants yet.</p>
              </div>
            ) : (
              <div className="rounded-box border border-base-300 bg-base-100">
                {product.variants.map((variant) => (
                  <VariantRow
                    key={variant.id}
                    variant={variant}
                    onManage={() => setManagingVariantId(variant.id)}
                    onEdit={() => {
                      editVariantAction.reset();
                      setEditingVariant(variant);
                    }}
                    onDelete={() => {
                      deleteVariantAction.reset();
                      setDeletingVariant(variant);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <EditProductModal
        open={isEditOpen}
        product={product}
        isSubmitting={editAction.isSubmitting}
        error={editAction.error}
        onCancel={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <CreateVariantModal
        open={isCreateVariantOpen}
        isSubmitting={createVariantAction.isSubmitting}
        error={createVariantAction.error}
        onCancel={() => setIsCreateVariantOpen(false)}
        onSubmit={handleCreateVariantSubmit}
      />

      <EditVariantModal
        open={editingVariant !== null}
        variant={editingVariant}
        isSubmitting={editVariantAction.isSubmitting}
        error={editVariantAction.error}
        onCancel={() => setEditingVariant(null)}
        onSubmit={handleEditVariantSubmit}
      />

      <VariantManageSheet
        variant={
          product.variants.find((variant) => variant.id === managingVariantId) ?? null
        }
        onClose={() => setManagingVariantId(null)}
        onAddMedia={(file, purpose) =>
          mutations.addVariantMedia(managingVariantId ?? "", file, purpose)
        }
        onRemoveMedia={mutations.removeMedia}
      />

      <ConfirmActionModal
        open={deletingVariant !== null}
        icon={Trash2}
        title={`Delete ${deletingVariant?.name}?`}
        description="This permanently removes the variant. Variants with provisioned physical units can't be deleted."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteVariantAction.isSubmitting}
        error={deleteVariantAction.error}
        onCancel={() => setDeletingVariant(null)}
        onConfirm={handleDeleteVariantConfirm}
      />

      <ConfirmActionModal
        open={isDeletingProduct}
        icon={Trash2}
        title={`Delete ${product.name}?`}
        description="This permanently removes the product. Products with provisioned physical units can't be deleted."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteProductAction.isSubmitting}
        error={deleteProductAction.error}
        onCancel={() => setIsDeletingProduct(false)}
        onConfirm={handleDeleteProductConfirm}
      />
    </div>
  );
}
