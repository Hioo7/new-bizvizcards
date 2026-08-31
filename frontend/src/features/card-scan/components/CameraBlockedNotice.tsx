import { Camera } from "lucide-react";
import UploadButton from "@features/card-scan/components/UploadButton";

interface CameraBlockedNoticeProps {
  onUpload: (file: File) => void;
  onRetry: () => void;
  disabled: boolean;
}

/** Shown when the browser has no camera or the user denied access —
 *  upload-only fallback. */
export default function CameraBlockedNotice({
  onUpload,
  onRetry,
  disabled,
}: CameraBlockedNoticeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        <Camera className="h-8 w-8 text-white/60" aria-hidden="true" />
      </span>
      <div>
        <p className="text-base font-semibold">Camera unavailable</p>
        <p className="mt-1 text-sm text-white/60">
          Allow camera access in your browser settings, or upload a photo of the
          card instead.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UploadButton onSelect={onUpload} disabled={disabled} prominent />
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-ghost btn-sm text-white/70"
        >
          Try the camera again
        </button>
      </div>
    </div>
  );
}
