import { useRef } from "react";
import { ImageUp } from "lucide-react";
import { CARD_SCAN_ACCEPT_MIME } from "@features/card-scan/config";

interface UploadButtonProps {
  onSelect: (file: File) => void;
  disabled: boolean;
  /** Bigger, labelled variant for the camera-blocked fallback screen. */
  prominent?: boolean;
}

/** Smaller circular button to pick a card photo from the gallery / files. */
export default function UploadButton({
  onSelect,
  disabled,
  prominent = false,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onSelect(file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={CARD_SCAN_ACCEPT_MIME}
        className="hidden"
        onChange={handleChange}
      />
      {prominent ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="btn btn-primary min-h-[44px] gap-2"
        >
          <ImageUp className="h-5 w-5" aria-hidden="true" />
          Upload a photo instead
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label="Upload a card photo"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform active:scale-90 disabled:opacity-40"
        >
          <ImageUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </>
  );
}
