import type { VirtualBackgroundQrCorner } from "@app-types/plan";
import {
  VIRTUAL_BACKGROUND_CAPTION_MAX_LENGTH,
  VIRTUAL_BACKGROUND_QR_CORNERS,
  VIRTUAL_BACKGROUND_QR_CORNER_LABELS,
} from "@features/virtual-backgrounds/config";
import type { VirtualBackgroundDraft } from "@features/virtual-backgrounds/types/virtualBackgroundDraft";

interface CornerCaptionStepProps {
  value: VirtualBackgroundDraft;
  onChange: (value: VirtualBackgroundDraft) => void;
}

const CORNER_POSITION_CLASSES: Record<VirtualBackgroundQrCorner, string> = {
  TOP_LEFT: "left-2 top-2",
  TOP_RIGHT: "right-2 top-2",
  BOTTOM_LEFT: "left-2 bottom-2",
  BOTTOM_RIGHT: "right-2 bottom-2",
};

export default function CornerCaptionStep({
  value,
  onChange,
}: CornerCaptionStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Where should the QR code sit?
        </p>
        <div className="relative mx-auto aspect-video w-full max-w-xs rounded-field border border-base-300 bg-base-200">
          {VIRTUAL_BACKGROUND_QR_CORNERS.map((corner) => (
            <button
              key={corner}
              type="button"
              aria-label={VIRTUAL_BACKGROUND_QR_CORNER_LABELS[corner]}
              onClick={() => onChange({ ...value, qrCorner: corner })}
              className={`absolute flex h-11 w-11 items-center justify-center rounded-field border-2 text-xs font-semibold ${
                CORNER_POSITION_CLASSES[corner]
              } ${
                value.qrCorner === corner
                  ? "border-primary bg-primary text-primary-content"
                  : "border-base-300 bg-base-100 text-base-content/50"
              }`}
            >
              QR
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Caption (optional)
        </span>
        <input
          type="text"
          value={value.captionText}
          maxLength={VIRTUAL_BACKGROUND_CAPTION_MAX_LENGTH}
          onChange={(event) =>
            onChange({ ...value, captionText: event.target.value })
          }
          placeholder="e.g. Scan to save my contact"
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
        <span className="self-end text-[10px] text-base-content/40">
          {value.captionText.length}/{VIRTUAL_BACKGROUND_CAPTION_MAX_LENGTH}
        </span>
      </label>
    </div>
  );
}
