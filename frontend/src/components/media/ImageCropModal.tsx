import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Crop, ZoomIn } from "lucide-react";
import { getCroppedImg } from "@components/media/cropImage";

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string | null;
  aspect: number;
  cropShape: "round" | "rect";
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export default function ImageCropModal({
  open,
  imageSrc,
  aspect,
  cropShape,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels, cropShape);
      onConfirm(file);
    } finally {
      setIsProcessing(false);
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Crop className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Crop image</h3>
        </div>

        {imageSrc && (
          <div className="relative mt-4 h-72 w-full overflow-hidden rounded-field bg-neutral sm:h-80">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={cropShape === "rect"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
            />
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0 text-base-content/50" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="range range-primary range-sm"
          />
        </div>

        <div className="modal-action">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isProcessing || !croppedAreaPixels}
            className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
          >
            {isProcessing && <span className="loading loading-spinner loading-sm" />}
            Use this crop
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>,
    document.body,
  );
}
