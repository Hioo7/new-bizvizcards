import { SMART_CARDS_BASE_PATH } from "@config/api";
import { SMART_CARD_MULTIPART_DATA_FIELD } from "@config/smartCardFields";
import { apiRequest } from "@services/apiClient";
import type {
  CreateSmartCardPayload,
  ListSmartCardsQuery,
  SmartCard,
  SmartCardImageUpload,
  SmartCardListResponse,
  SmartCardTemplateKey,
  UpdateSmartCardPayload,
} from "@app-types/smartCard";

function buildFormData(
  payload: CreateSmartCardPayload | UpdateSmartCardPayload,
  files: SmartCardImageUpload[],
): FormData {
  const formData = new FormData();
  formData.set(SMART_CARD_MULTIPART_DATA_FIELD, JSON.stringify(payload));
  for (const upload of files) {
    formData.set(upload.fieldName, upload.file);
  }
  return formData;
}

export function listSmartCards(
  templateKey: SmartCardTemplateKey,
  query: ListSmartCardsQuery,
): Promise<SmartCardListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.customerId) params.set("customerId", query.customerId);

  return apiRequest<SmartCardListResponse>(
    `${SMART_CARDS_BASE_PATH}/${templateKey}?${params.toString()}`,
    { method: "GET" },
  );
}

export function getSmartCard(
  templateKey: SmartCardTemplateKey,
  id: string,
): Promise<SmartCard> {
  return apiRequest<SmartCard>(
    `${SMART_CARDS_BASE_PATH}/${templateKey}/${id}`,
    { method: "GET" },
  );
}

export function createSmartCard(
  templateKey: SmartCardTemplateKey,
  payload: CreateSmartCardPayload,
  files: SmartCardImageUpload[],
): Promise<SmartCard> {
  return apiRequest<SmartCard>(`${SMART_CARDS_BASE_PATH}/${templateKey}`, {
    method: "POST",
    body: buildFormData(payload, files),
  });
}

export function updateSmartCard(
  templateKey: SmartCardTemplateKey,
  id: string,
  payload: UpdateSmartCardPayload,
  files: SmartCardImageUpload[],
): Promise<SmartCard> {
  return apiRequest<SmartCard>(
    `${SMART_CARDS_BASE_PATH}/${templateKey}/${id}`,
    { method: "PATCH", body: buildFormData(payload, files) },
  );
}

export function deleteSmartCard(
  templateKey: SmartCardTemplateKey,
  id: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `${SMART_CARDS_BASE_PATH}/${templateKey}/${id}`,
    { method: "DELETE" },
  );
}
