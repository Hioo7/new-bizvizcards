import { EMAIL_SIGNATURES_BASE_PATH } from "@config/api";
import { EMAIL_SIGNATURE_MULTIPART_DATA_FIELD } from "@features/email-signatures/config/emailSignatureFields";
import { apiRequest } from "@services/apiClient";
import type {
  EmailSignature,
  EmailSignatureImageUpload,
  EmailSignaturePayload,
  EmailSignaturePreviewPayload,
  EmailSignaturePreviewResult,
  UpdateEmailSignaturePayload,
} from "@app-types/emailSignature";

const ME_BASE_PATH = `${EMAIL_SIGNATURES_BASE_PATH}/me`;

function buildFormData(
  payload: EmailSignaturePayload | UpdateEmailSignaturePayload,
  files: EmailSignatureImageUpload[],
): FormData {
  const formData = new FormData();
  formData.set(EMAIL_SIGNATURE_MULTIPART_DATA_FIELD, JSON.stringify(payload));
  for (const upload of files) {
    formData.set(upload.fieldName, upload.file);
  }
  return formData;
}

export function listMyEmailSignatures(): Promise<EmailSignature[]> {
  return apiRequest<EmailSignature[]>(ME_BASE_PATH, { method: "GET" });
}

export function getMyEmailSignature(id: string): Promise<EmailSignature> {
  return apiRequest<EmailSignature>(`${ME_BASE_PATH}/${id}`, {
    method: "GET",
  });
}

export function createMyEmailSignature(
  payload: EmailSignaturePayload,
  files: EmailSignatureImageUpload[],
): Promise<EmailSignature> {
  return apiRequest<EmailSignature>(ME_BASE_PATH, {
    method: "POST",
    body: buildFormData(payload, files),
  });
}

export function updateMyEmailSignature(
  id: string,
  payload: UpdateEmailSignaturePayload,
  files: EmailSignatureImageUpload[],
): Promise<EmailSignature> {
  return apiRequest<EmailSignature>(`${ME_BASE_PATH}/${id}`, {
    method: "PATCH",
    body: buildFormData(payload, files),
  });
}

export function deleteMyEmailSignature(id: string): Promise<void> {
  return apiRequest<void>(`${ME_BASE_PATH}/${id}`, { method: "DELETE" });
}

export function previewMyEmailSignature(
  payload: EmailSignaturePreviewPayload,
): Promise<EmailSignaturePreviewResult> {
  return apiRequest<EmailSignaturePreviewResult>(`${ME_BASE_PATH}/preview`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
