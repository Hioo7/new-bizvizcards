import { useState } from "react";
import { Images, Plus, Trash2 } from "lucide-react";
import ImageSlotField from "@components/media/ImageSlotField";
import EmptyStepState from "@components/EmptyStepState";
import EditSheetShell from "@components/EditSheetShell";
import {
  ECARD_MAX_GALLERY_IMAGES,
  ECARD_MAX_SUB_GALLERIES,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from "@features/ecards/config/ecardBuilder.config";
import type {
  GalleryComponentDraft,
  GallerySubGalleryDraft,
} from "@features/ecards/types/ecardBuilder.types";
import { emptyImageField } from "@app-types/media.types";
import type { ImageFieldValue } from "@app-types/media.types";

interface GalleryEditSheetProps {
  open: boolean;
  draft: GalleryComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: GalleryComponentDraft) => void;
}

export default function GalleryEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: GalleryEditSheetProps) {
  const [subGalleries, setSubGalleries] = useState<GallerySubGalleryDraft[]>(
    draft.subGalleries,
  );

  function addSubGallery() {
    if (subGalleries.length >= ECARD_MAX_SUB_GALLERIES) return;
    setSubGalleries([...subGalleries, { title: "", images: [] }]);
  }

  function removeSubGallery(index: number) {
    setSubGalleries(subGalleries.filter((_, i) => i !== index));
  }

  function updateSubGalleryTitle(index: number, title: string) {
    setSubGalleries(
      subGalleries.map((sub, i) => (i === index ? { ...sub, title } : sub)),
    );
  }

  function addImage(subIndex: number) {
    setSubGalleries(
      subGalleries.map((sub, i) =>
        i === subIndex ? { ...sub, images: [...sub.images, emptyImageField()] } : sub,
      ),
    );
  }

  function updateImage(subIndex: number, imageIndex: number, value: ImageFieldValue) {
    setSubGalleries(
      subGalleries.map((sub, i) =>
        i === subIndex
          ? {
              ...sub,
              images: sub.images.map((img, j) => (j === imageIndex ? value : img)),
            }
          : sub,
      ),
    );
  }

  function removeImage(subIndex: number, imageIndex: number) {
    setSubGalleries(
      subGalleries.map((sub, i) =>
        i === subIndex
          ? { ...sub, images: sub.images.filter((_, j) => j !== imageIndex) }
          : sub,
      ),
    );
  }

  function handleSave() {
    onSave({ type: "GALLERY", subGalleries });
  }

  return (
    <EditSheetShell
      open={open}
      icon={Images}
      title="Gallery"
      onClose={onClose}
      onSave={handleSave}
      isSubmitting={isSubmitting}
      error={error}
    >
      {subGalleries.length === 0 && (
        <EmptyStepState icon={Images} message="No sub-galleries yet." />
      )}

      {subGalleries.map((subGallery, subIndex) => (
        <div
          key={subIndex}
          className="rounded-field border border-base-300 bg-base-200/50 p-3"
        >
          <div className="mb-3 flex items-center gap-2">
            <input
              value={subGallery.title}
              onChange={(event) => updateSubGalleryTitle(subIndex, event.target.value)}
              maxLength={ECARD_TEXT_SHORT_MAX_LENGTH}
              placeholder="Sub-gallery title (optional)"
              className="flex-1 rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm text-base-content focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeSubGallery(subIndex)}
              aria-label="Remove sub-gallery"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-error hover:bg-error/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {subGallery.images.map((image, imageIndex) => (
              <ImageSlotField
                key={imageIndex}
                label=""
                value={image}
                onChange={(value) => updateImage(subIndex, imageIndex, value)}
                cropShape="rect"
                variant="square"
                skipCrop
                onRemove={() => removeImage(subIndex, imageIndex)}
              />
            ))}
            {subGallery.images.length < ECARD_MAX_GALLERY_IMAGES && (
              <button
                type="button"
                onClick={() => addImage(subIndex)}
                aria-label="Add photo"
                className="flex h-28 w-28 items-center justify-center rounded-field border border-dashed border-base-300 text-base-content/40 hover:border-primary hover:text-primary"
              >
                <Plus className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      ))}

      {subGalleries.length < ECARD_MAX_SUB_GALLERIES && (
        <button
          type="button"
          onClick={addSubGallery}
          className="btn min-h-11 gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200"
        >
          <Plus className="h-4 w-4" />
          Add sub-gallery
        </button>
      )}
    </EditSheetShell>
  );
}
