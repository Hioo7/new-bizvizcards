import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import ImageCropModal from "@features/smart-cards/components/ImageCropModal";
import {
  SMART_CARD_IMAGE_ALLOWED_MIME_TYPES,
  SMART_CARD_IMAGE_MAX_SIZE_BYTES,
} from "@features/smart-cards/config/smartCardForm.config";
import type { ImageFieldValue } from "@features/smart-cards/types/smartCardForm.types";

interface ImageSlotFieldProps {
  label: string;
  value: ImageFieldValue;
  onChange: (value: ImageFieldValue) => void;
  /** Crop aspect ratio (width / height), matching how the image renders in the public template. */
  aspect: number;
  /** Crop shape, matching how the image renders in the public template. */
  cropShape: "round" | "rect";
  error?: string;
}

export default function ImageSlotField({
  label,
  value,
  onChange,
  aspect,
  cropShape,
  error,
}: ImageSlotFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);

  const objectUrl = useMemo(
    () => (value.file ? URL.createObjectURL(value.file) : null),
    [value.file],
  );

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    return () => {
      if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    };
  }, [pendingImageSrc]);

  const previewUrl = objectUrl ?? value.existingUrl ?? null;
  const thumbnailShapeClass = cropShape === "round" ? "rounded-full" : "rounded-field";

  function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (!SMART_CARD_IMAGE_ALLOWED_MIME_TYPES.includes(file.type)) return;
    if (file.size > SMART_CARD_IMAGE_MAX_SIZE_BYTES) return;
    setPendingImageSrc(URL.createObjectURL(file));
  }

  function handleCropCancel() {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleCropConfirm(croppedFile: File) {
    onChange({ ...value, file: croppedFile });
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-base-content/70">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-base-300 bg-base-200 ${thumbnailShapeClass}`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-5 w-5 text-base-content/30" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn btn-sm min-h-9 rounded-field border border-base-300 bg-base-100 text-xs text-base-content hover:bg-base-200"
          >
            {previewUrl ? "Replace" : "Upload"}
          </button>
          {value.file && (
            <button
              type="button"
              onClick={() => onChange({ ...value, file: null })}
              className="inline-flex items-center gap-1 text-xs text-base-content/50 hover:text-error"
            >
              <X className="h-3 w-3" />
              Undo selection
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={SMART_CARD_IMAGE_ALLOWED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(event) => handleFileSelected(event.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}

      <ImageCropModal
        key={pendingImageSrc ?? "empty"}
        open={pendingImageSrc !== null}
        imageSrc={pendingImageSrc}
        aspect={aspect}
        cropShape={cropShape}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
