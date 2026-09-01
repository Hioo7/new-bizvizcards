import { BULK_MESSENGER_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  BulkMessageSendDetail,
  BulkMessageSendSummary,
  BulkMessageTemplateDetail,
  BulkMessageTemplateSummary,
  CreateBulkMessageSendPayload,
  CreateBulkMessageTemplatePayload,
  PlaceholdersResponse,
  UpdateBulkMessageTemplatePayload,
  ValidLeadRow,
} from "@app-types/bulkMessenger";

const TEMPLATES_PATH = `${BULK_MESSENGER_BASE_PATH}/templates`;
const SENDS_PATH = `${BULK_MESSENGER_BASE_PATH}/sends`;

export function listBulkMessageTemplates(): Promise<
  BulkMessageTemplateSummary[]
> {
  return apiRequest<BulkMessageTemplateSummary[]>(TEMPLATES_PATH, {
    method: "GET",
  });
}

export function getBulkMessageTemplate(
  id: string,
): Promise<BulkMessageTemplateDetail> {
  return apiRequest<BulkMessageTemplateDetail>(`${TEMPLATES_PATH}/${id}`, {
    method: "GET",
  });
}

export function createBulkMessageTemplate(
  payload: CreateBulkMessageTemplatePayload,
): Promise<BulkMessageTemplateDetail> {
  return apiRequest<BulkMessageTemplateDetail>(TEMPLATES_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBulkMessageTemplate(
  id: string,
  payload: UpdateBulkMessageTemplatePayload,
): Promise<BulkMessageTemplateDetail> {
  return apiRequest<BulkMessageTemplateDetail>(`${TEMPLATES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteBulkMessageTemplate(id: string): Promise<void> {
  return apiRequest<void>(`${TEMPLATES_PATH}/${id}`, { method: "DELETE" });
}

export function getBulkMessagePlaceholders(
  formId?: string | null,
): Promise<PlaceholdersResponse> {
  const query = formId ? `?formId=${encodeURIComponent(formId)}` : "";
  return apiRequest<PlaceholdersResponse>(
    `${TEMPLATES_PATH}/placeholders${query}`,
    { method: "GET" },
  );
}

export function getTemplateValidLeads(
  templateId: string,
): Promise<ValidLeadRow[]> {
  return apiRequest<ValidLeadRow[]>(
    `${TEMPLATES_PATH}/${templateId}/valid-leads`,
    { method: "GET" },
  );
}

export function listBulkMessageSends(): Promise<BulkMessageSendSummary[]> {
  return apiRequest<BulkMessageSendSummary[]>(SENDS_PATH, { method: "GET" });
}

export function getBulkMessageSend(id: string): Promise<BulkMessageSendDetail> {
  return apiRequest<BulkMessageSendDetail>(`${SENDS_PATH}/${id}`, {
    method: "GET",
  });
}

export function createBulkMessageSend(
  payload: CreateBulkMessageSendPayload,
): Promise<BulkMessageSendDetail> {
  return apiRequest<BulkMessageSendDetail>(SENDS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function markBulkMessageRecipientMessaged(
  sendId: string,
  recipientId: string,
): Promise<void> {
  return apiRequest<void>(
    `${SENDS_PATH}/${sendId}/recipients/${recipientId}`,
    { method: "PATCH" },
  );
}

export function deleteBulkMessageSend(id: string): Promise<void> {
  return apiRequest<void>(`${SENDS_PATH}/${id}`, { method: "DELETE" });
}
