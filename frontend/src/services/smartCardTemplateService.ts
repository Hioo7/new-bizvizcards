import { SMART_CARD_TEMPLATES_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { SmartCardTemplateSummary } from "@app-types/smartCardTemplate";

export function listSmartCardTemplates(): Promise<SmartCardTemplateSummary[]> {
  return apiRequest<SmartCardTemplateSummary[]>(SMART_CARD_TEMPLATES_BASE_PATH, {
    method: "GET",
  });
}
