import { Images, Layers, Package } from "lucide-react";
import EditSheetShell from "@components/EditSheetShell";
import type { ProductMediaPurpose, ProductVariant } from "@app-types/product.types";
import ProductMediaSection from "@features/product-management/components/ProductMediaSection";
import ProductUnitsPanel from "@features/product-management/components/ProductUnitsPanel";

interface VariantManageSheetProps {
  variant: ProductVariant | null;
  onClose: () => void;
  onAddMedia: (file: File, purpose: ProductMediaPurpose) => Promise<void>;
  onRemoveMedia: (productMediaId: string) => Promise<void>;
}

export default function VariantManageSheet({
  variant,
  onClose,
  onAddMedia,
  onRemoveMedia,
}: VariantManageSheetProps) {
  return (
    <EditSheetShell
      open={variant !== null}
      icon={Layers}
      title={variant?.name ?? ""}
      subtitle={variant ? `SKU: ${variant.sku}` : undefined}
      onClose={onClose}
    >
      {variant && (
        <>
          <section className="flex flex-col gap-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
              <Images className="h-3.5 w-3.5" />
              Media
            </p>
            <ProductMediaSection
              media={variant.media}
              onAddMedia={onAddMedia}
              onRemoveMedia={onRemoveMedia}
            />
          </section>

          <div className="border-t border-base-300" />

          <section className="flex flex-col gap-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
              <Package className="h-3.5 w-3.5" />
              Physical units
            </p>
            <ProductUnitsPanel variantId={variant.id} />
          </section>
        </>
      )}
    </EditSheetShell>
  );
}
