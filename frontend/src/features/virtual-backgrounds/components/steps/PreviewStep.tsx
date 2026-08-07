import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { ecardPublicPath } from "@config/routes";
import type { VirtualBackgroundQrCorner } from "@app-types/plan";
import type { Ecard } from "@app-types/ecard";
import type { VirtualBackgroundTemplateSummary } from "@app-types/virtualBackground";
import type { VirtualBackgroundDraft } from "@features/virtual-backgrounds/types/virtualBackgroundDraft";

interface PreviewStepProps {
  value: VirtualBackgroundDraft;
  ecards: Ecard[];
  templates: VirtualBackgroundTemplateSummary[];
}

const CORNER_POSITION_CLASSES: Record<VirtualBackgroundQrCorner, string> = {
  TOP_LEFT: "left-3 top-3 items-start",
  TOP_RIGHT: "right-3 top-3 items-end",
  BOTTOM_LEFT: "left-3 bottom-3 items-start",
  BOTTOM_RIGHT: "right-3 bottom-3 items-end",
};

export default function PreviewStep({
  value,
  ecards,
  templates,
}: PreviewStepProps) {
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null);

  // Object URLs are an external browser resource, not derived state — the
  // URL must be created and revoked together, inside the same effect
  // instance, so a create-in-memo/revoke-in-a-different-effect split (which
  // broke under StrictMode's dev-only double-invoke: the phantom remount
  // reused the memoized URL after it had already been revoked) can't happen.
  useEffect(() => {
    if (value.source !== "CUSTOM" || !value.customFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.customFile);
    setCustomPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.source, value.customFile]);

  const selectedEcard = ecards.find((ecard) => ecard.id === value.ecardId);
  const selectedTemplate = templates.find(
    (template) => template.id === value.templateId,
  );
  const baseImageUrl =
    value.source === "TEMPLATE" ? selectedTemplate?.imageUrl : customPreviewUrl;
  const ecardUrl = selectedEcard
    ? `${window.location.origin}${ecardPublicPath(selectedEcard.endpoint)}`
    : "";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-base-content/50">
        Approximate preview — the final downloadable image is generated at full
        1920x1080 resolution once you save.
      </p>
      <div className="relative aspect-video w-full overflow-hidden rounded-field border border-base-300 bg-base-300">
        {baseImageUrl && (
          <img
            src={baseImageUrl}
            alt="Virtual background preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {ecardUrl && (
          <div
            className={`absolute flex flex-col gap-1 rounded-field bg-white p-2 shadow-md ${CORNER_POSITION_CLASSES[value.qrCorner]}`}
          >
            <QRCodeCanvas value={ecardUrl} size={64} marginSize={0} />
            {value.captionText && (
              <p className="max-w-16 text-center text-[8px] font-semibold text-neutral">
                {value.captionText}
              </p>
            )}
          </div>
        )}
      </div>
      {selectedEcard && (
        <p className="text-center text-xs text-base-content/50">
          Links to <span className="font-medium">{selectedEcard.hero.name}</span>
        </p>
      )}
    </div>
  );
}
