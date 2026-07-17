import { useState } from "react";
import { Images, Sparkles } from "lucide-react";
import ImageSlotField from "@components/media/ImageSlotField";
import { emptyImageField } from "@app-types/media.types";
import type { ProductMediaEntry, ProductMediaPurpose } from "@app-types/product.types";
import { PRODUCT_GALLERY_MAX_IMAGES } from "@features/product-management/config/productManagement.config";

interface ProductMediaSectionProps {
  media: ProductMediaEntry[];
  onAddMedia: (file: File, purpose: ProductMediaPurpose) => Promise<void>;
  onRemoveMedia: (productMediaId: string) => Promise<void>;
}

export default function ProductMediaSection({
  media,
  onAddMedia,
  onRemoveMedia,
}: ProductMediaSectionProps) {
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const preview = media.find((entry) => entry.purpose === "PREVIEW") ?? null;
  const gallery = media
    .filter((entry) => entry.purpose === "GALLERY")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleAdd(file: File, purpose: ProductMediaPurpose, slotKey: string) {
    setBusySlot(slotKey);
    try {
      await onAddMedia(file, purpose);
    } finally {
      setBusySlot(null);
    }
  }

  async function handleRemove(entryId: string) {
    setBusySlot(entryId);
    try {
      await onRemoveMedia(entryId);
    } finally {
      setBusySlot(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          <Sparkles className="h-3.5 w-3.5" />
          Connect popup preview
        </p>
        <p className="mb-2 text-xs text-base-content/50">
          Shown when someone taps/scans an unclaimed unit. Supports animated GIFs.
        </p>
        <div className={busySlot === "preview" ? "opacity-50" : undefined}>
          <ImageSlotField
            label="Preview"
            value={{ file: null, existingUrl: preview?.url }}
            onChange={(value) => {
              if (value.file) void handleAdd(value.file, "PREVIEW", "preview");
            }}
            cropShape="rect"
            variant="card"
            skipCrop
            onRemove={preview ? () => void handleRemove(preview.id) : undefined}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
            <Images className="h-3.5 w-3.5" />
            Gallery
          </p>
          <span className="text-xs text-base-content/40">
            {gallery.length}/{PRODUCT_GALLERY_MAX_IMAGES}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((entry) => (
            <div key={entry.id} className={busySlot === entry.id ? "opacity-50" : undefined}>
              <ImageSlotField
                label=""
                value={{ file: null, existingUrl: entry.url }}
                onChange={() => {
                  /* existing gallery slots are remove-only, replaced via new upload below */
                }}
                cropShape="rect"
                variant="card"
                skipCrop
                onRemove={() => void handleRemove(entry.id)}
              />
            </div>
          ))}
          {gallery.length < PRODUCT_GALLERY_MAX_IMAGES && (
            <div className={busySlot === "gallery-new" ? "opacity-50" : undefined}>
              <ImageSlotField
                label="Add photo"
                value={emptyImageField()}
                onChange={(value) => {
                  if (value.file) void handleAdd(value.file, "GALLERY", "gallery-new");
                }}
                cropShape="rect"
                variant="card"
                skipCrop
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
