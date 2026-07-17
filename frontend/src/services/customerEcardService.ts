import { ECARD_MULTIPART_DATA_FIELD } from "@config/ecardFields";
import { ECARD_ENDPOINTS } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { Ecard, EcardImageUpload, EcardPayload } from "@app-types/ecard";

function buildFormData(
  payload: EcardPayload,
  files: EcardImageUpload[],
): FormData {
  const formData = new FormData();
  formData.set(ECARD_MULTIPART_DATA_FIELD, JSON.stringify(payload));
  for (const upload of files) {
    formData.set(upload.fieldName, upload.file);
  }
  return formData;
}

export function listCustomerEcards(): Promise<Ecard[]> {
  return apiRequest<Ecard[]>(ECARD_ENDPOINTS.me);
}

export function createCustomerEcard(
  payload: EcardPayload,
  files: EcardImageUpload[],
): Promise<Ecard> {
  return apiRequest<Ecard>(ECARD_ENDPOINTS.create, {
    method: "POST",
    body: buildFormData(payload, files),
  });
}

export function updateCustomerEcard(
  id: string,
  payload: EcardPayload,
  files: EcardImageUpload[],
): Promise<Ecard> {
  return apiRequest<Ecard>(ECARD_ENDPOINTS.meById(id), {
    method: "PATCH",
    body: buildFormData(payload, files),
  });
}

export function deleteCustomerEcard(id: string): Promise<void> {
  return apiRequest<void>(ECARD_ENDPOINTS.meById(id), { method: "DELETE" });
}
