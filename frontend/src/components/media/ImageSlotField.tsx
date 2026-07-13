import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import ImageCropModal from "@components/media/ImageCropModal";
import { compressImage } from "@components/media/compressImage";
import {
  IMAGE_ALLOWED_MIME_TYPES,
  IMAGE_MAX_SIZE_BYTES,
} from "@config/media.config";
import type { ImageFieldValue } from "@app-types/media.types";

interface ImageSlotFieldProps {
  label: string;
  value: ImageFieldValue;
  onChange: (value: ImageFieldValue) => void;
  /** Crop aspect ratio (width / height), matching how the image renders in the public template. Unused when skipCrop is set. */
  aspect?: number;
  /** Crop shape, matching how the image renders in the public template. */
  cropShape: "round" | "rect";
  /** Visual preview container for non-avatar slots: a fixed square thumbnail, or a wide card matching a public-template gallery card. */
  variant?: "square" | "card";
  /**
   * Skips the crop step entirely and uploads the selected file as-is. Use when the public
   * template preserves the source image's own aspect ratio (e.g. object-fit: contain) instead
   * of forcing every upload into one fixed shape.
   */
  skipCrop?: boolean;
  /**
   * When provided, the delete badge removes this whole slot (e.g. a gallery photo entry)
   * instead of just clearing the currently-selected file, and is shown for existing images too.
   */
  onRemove?: () => void;
  error?: string;
}

export default function ImageSlotField({
  label,
  value,
  onChange,
  aspect,
  cropShape,
  variant = "square",
  skipCrop = false,
  onRemove,
  error,
}: ImageSlotFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

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
  const thumbnailShapeClass = variant === "card" ? "rounded-xl" : "rounded-field";
  const isAvatar = cropShape === "round";
  const showDeleteBadge = onRemove ? true : value.file !== null;
  const handleDelete = onRemove ?? (() => onChange({ ...value, file: null }));

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (!IMAGE_ALLOWED_MIME_TYPES.includes(file.type)) return;
    if (file.size > IMAGE_MAX_SIZE_BYTES) return;
    if (skipCrop) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        onChange({ ...value, file: compressed });
      } finally {
        setIsCompressing(false);
        if (inputRef.current) inputRef.current.value = "";
      }
      return;
    }
    setPendingImageSrc(URL.createObjectURL(file));
  }

  function handleCropCancel() {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleCropConfirm(croppedFile: File) {
    setIsCompressing(true);
    try {
      const compressed = await compressImage(croppedFile);
      onChange({ ...value, file: compressed });
    } finally {
      setIsCompressing(false);
      if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
      setPendingImageSrc(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={IMAGE_ALLOWED_MIME_TYPES.join(",")}
      className="hidden"
      onChange={(event) => void handleFileSelected(event.target.files?.[0])}
    />
  );

  const cropModal = skipCrop ? null : (
    <ImageCropModal
      key={pendingImageSrc ?? "empty"}
      open={pendingImageSrc !== null}
      imageSrc={pendingImageSrc}
      aspect={aspect ?? 1}
      cropShape={cropShape}
      onCancel={handleCropCancel}
      onConfirm={(file) => void handleCropConfirm(file)}
    />
  );

  if (isAvatar) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold text-base-content/70">{label}</p>
        <div className="relative h-32 w-32">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-200">
            {isCompressing ? (
              <span className="loading loading-spinner loading-sm text-base-content/40" />
            ) : previewUrl ? (
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-8 w-8 text-base-content/30" />
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label={previewUrl ? "Replace photo" : "Upload photo"}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-content ring-2 ring-base-100 hover:bg-primary/90"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          {value.file && (
            <button
              type="button"
              onClick={() => onChange({ ...value, file: null })}
              aria-label="Remove photo"
              className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-error text-error-content ring-2 ring-base-100 hover:bg-error/90"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {fileInput}
        {cropModal}
      </div>
    );
  }

  const containerSizeClass = variant === "card" ? "aspect-[4/3] w-full" : "h-28 w-28";

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-base-content/70">
        {label}
      </p>
      <div className={`relative ${containerSizeClass}`}>
        <div
          className={`flex h-full w-full items-center justify-center overflow-hidden border border-base-300 bg-base-200 ${thumbnailShapeClass}`}
        >
          {isCompressing ? (
            <span className="loading loading-spinner loading-sm text-base-content/40" />
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-7 w-7 text-base-content/30" />
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={previewUrl ? "Replace image" : "Upload image"}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-content ring-2 ring-base-100 hover:bg-primary/90"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
        {showDeleteBadge && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Remove image"
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-error text-error-content ring-2 ring-base-100 hover:bg-error/90"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        {fileInput}
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}

      {cropModal}
    </div>
  );
}
