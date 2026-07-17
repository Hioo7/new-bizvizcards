import { Pencil, Trash2 } from "lucide-react";
import type { ProductVariant } from "@app-types/product.types";
import MediaThumbnail from "@features/product-management/components/MediaThumbnail";
import { findPreviewMediaUrl } from "@features/product-management/utils/findPreviewMedia";

interface VariantRowProps {
  variant: ProductVariant;
  onManage: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function VariantRow({
  variant,
  onManage,
  onEdit,
  onDelete,
}: VariantRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onManage}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onManage();
        }
      }}
      className="flex cursor-pointer items-center gap-3 border-b border-base-300 bg-base-100 px-3 py-3 last:border-b-0 hover:bg-base-200/50"
    >
      <MediaThumbnail previewUrl={findPreviewMediaUrl(variant.media)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-base-content">
          {variant.name}
        </p>
        <p className="truncate text-xs text-base-content/50">
          SKU: {variant.sku} · ₹{variant.price}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Edit ${variant.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Delete ${variant.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-error/70 hover:bg-error/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
