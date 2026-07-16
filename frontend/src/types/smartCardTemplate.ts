import type { SmartCardTemplateKey } from "./smartCard";

export interface SmartCardTemplateSummary {
  id: string;
  key: SmartCardTemplateKey;
  name: string;
  previewImageUrl: string | null;
}
