import { useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import EmptyStepState from "@components/EmptyStepState";
import { readImageDimensions } from "@utils/readImageDimensions";
import {
  VIRTUAL_BACKGROUND_HEIGHT_PX,
  VIRTUAL_BACKGROUND_WIDTH_PX,
} from "@features/virtual-backgrounds/config";
import type { VirtualBackgroundDraft } from "@features/virtual-backgrounds/types/virtualBackgroundDraft";
import type { Ecard } from "@app-types/ecard";
import type { VirtualBackgroundTemplateSummary } from "@app-types/virtualBackground";

interface BaseImageStepProps {
  ecards: Ecard[];
  templates: VirtualBackgroundTemplateSummary[];
  allowCustomBackground: boolean;
  value: VirtualBackgroundDraft;
  onChange: (value: VirtualBackgroundDraft) => void;
}

export default function BaseImageStep({
  ecards,
  templates,
  allowCustomBackground,
  value,
  onChange,
}: BaseImageStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  if (ecards.length === 0) {
    return (
      <EmptyStepState
        icon={ImagePlus}
        message="Create an e-card first — a virtual background links to one of your e-cards."
      />
    );
  }

  async function handleCustomFileSelected(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    try {
      const { width, height } = await readImageDimensions(file);
      if (width < VIRTUAL_BACKGROUND_WIDTH_PX || height < VIRTUAL_BACKGROUND_HEIGHT_PX) {
        setFileError(
          `Image must be at least ${VIRTUAL_BACKGROUND_WIDTH_PX}x${VIRTUAL_BACKGROUND_HEIGHT_PX}px (this image is ${width}x${height}px).`,
        );
        return;
      }
      onChange({ ...value, source: "CUSTOM", templateId: null, customFile: file });
    } catch {
      setFileError("Could not read image file.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {ecards.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Which e-card should the QR code link to?
          </p>
          <div className="flex flex-col gap-2">
            {ecards.map((ecard) => (
              <label
                key={ecard.id}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-field border px-3 py-2 ${
                  value.ecardId === ecard.id
                    ? "border-primary bg-primary/5"
                    : "border-base-300 bg-base-200"
                }`}
              >
                <input
                  type="radio"
                  name="ecard"
                  className="radio radio-primary radio-sm"
                  checked={value.ecardId === ecard.id}
                  onChange={() => onChange({ ...value, ecardId: ecard.id })}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-base-content">
                    {ecard.hero.name}
                  </p>
                  <p className="truncate text-xs text-base-content/50">
                    /{ecard.endpoint}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Choose a base image
        </p>
        {templates.length === 0 && !allowCustomBackground && (
          <p className="text-sm text-base-content/60">
            No preset backgrounds are available on your plan.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {templates.map((template) => {
            const isSelected =
              value.source === "TEMPLATE" && value.templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    source: "TEMPLATE",
                    templateId: template.id,
                    customFile: null,
                  })
                }
                className={`flex flex-col overflow-hidden rounded-field border-2 text-left ${
                  isSelected ? "border-primary" : "border-transparent"
                }`}
              >
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="aspect-video w-full object-cover"
                />
                <span className="truncate bg-base-200 px-2 py-1 text-xs font-medium text-base-content">
                  {template.name}
                </span>
              </button>
            );
          })}

          {allowCustomBackground && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex aspect-video flex-col items-center justify-center gap-1 rounded-field border-2 border-dashed text-center ${
                value.source === "CUSTOM"
                  ? "border-primary bg-primary/5"
                  : "border-base-300 bg-base-200"
              }`}
            >
              <Upload className="h-5 w-5 text-base-content/50" />
              <span className="px-2 text-xs font-medium text-base-content/70">
                {value.source === "CUSTOM" && value.customFile
                  ? value.customFile.name
                  : "Upload your own"}
              </span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) =>
            void handleCustomFileSelected(event.target.files?.[0])
          }
        />
        {fileError && <p className="mt-2 text-xs text-error">{fileError}</p>}
      </div>
    </div>
  );
}
