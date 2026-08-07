import type { VirtualBackgroundQrCorner } from "@app-types/plan";

export interface VirtualBackgroundDraft {
  ecardId: string | null;
  source: "TEMPLATE" | "CUSTOM" | null;
  templateId: string | null;
  customFile: File | null;
  qrCorner: VirtualBackgroundQrCorner;
  captionText: string;
}

export function createEmptyVirtualBackgroundDraft(): VirtualBackgroundDraft {
  return {
    ecardId: null,
    source: null,
    templateId: null,
    customFile: null,
    qrCorner: "BOTTOM_RIGHT",
    captionText: "",
  };
}
