import type { VirtualBackgroundQrCorner } from "@app-types/plan";

export interface VirtualBackgroundTemplateSummary {
  id: string;
  name: string;
  order: number;
  imageUrl: string;
}

export interface VirtualBackgroundSummary {
  id: string;
  ecardId: string;
  qrCorner: VirtualBackgroundQrCorner;
  captionText: string | null;
  imageUrl: string;
  createdAt: string;
}

export type CreateVirtualBackgroundPayload =
  | {
      source: "TEMPLATE";
      templateId: string;
      ecardId: string;
      qrCorner: VirtualBackgroundQrCorner;
      captionText?: string;
    }
  | {
      source: "CUSTOM";
      ecardId: string;
      qrCorner: VirtualBackgroundQrCorner;
      captionText?: string;
    };
