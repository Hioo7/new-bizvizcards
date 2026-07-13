import { useRef } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import {
  ECARD_BROCHURE_ALLOWED_MIME_TYPES,
  ECARD_BROCHURE_MAX_SIZE_BYTES,
} from "@features/ecards/config/ecardBuilder.config";
import type { ImageFieldValue } from "@app-types/media.types";

interface BrochurePdfFieldProps {
  label: string;
  value: ImageFieldValue;
  onChange: (value: ImageFieldValue) => void;
  error?: string;
}

export default function BrochurePdfField({
  label,
  value,
  onChange,
  error,
}: BrochurePdfFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(value.file ?? value.existingUrl);

  function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (!ECARD_BROCHURE_ALLOWED_MIME_TYPES.includes(file.type)) return;
    if (file.size > ECARD_BROCHURE_MAX_SIZE_BYTES) return;
    onChange({ ...value, file });
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    onChange({ file: null });
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-base-content/70">
        {label}
      </p>
      <div className="flex items-center gap-3 rounded-field border border-base-300 bg-base-200 p-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field bg-base-100 text-base-content/60">
          <FileText className="h-5 w-5" />
        </div>
        <p className="min-w-0 flex-1 truncate text-sm text-base-content">
          {hasFile ? (value.file?.name ?? "PDF uploaded") : "No PDF uploaded"}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={hasFile ? "Replace PDF" : "Upload PDF"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
        </button>
        {hasFile && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove PDF"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error text-error-content hover:bg-error/90"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ECARD_BROCHURE_ALLOWED_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(event) => handleFileSelected(event.target.files?.[0])}
      />
    </div>
  );
}
