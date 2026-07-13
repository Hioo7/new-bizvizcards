import { EMPLOYEE_ECARDS_BASE_PATH } from "@config/api";
import { ECARD_MULTIPART_DATA_FIELD } from "@config/ecardFields";
import { apiRequest } from "@services/apiClient";
import type {
  CreateEcardAsEmployeePayload,
  Ecard,
  EcardImageUpload,
  EcardListResponse,
  ListEcardsQuery,
  UpdateEcardPayload,
} from "@app-types/ecard";

function buildFormData(
  payload: CreateEcardAsEmployeePayload | UpdateEcardPayload,
  files: EcardImageUpload[],
): FormData {
  const formData = new FormData();
  formData.set(ECARD_MULTIPART_DATA_FIELD, JSON.stringify(payload));
  for (const upload of files) {
    formData.set(upload.fieldName, upload.file);
  }
  return formData;
}

export function listEcards(query: ListEcardsQuery): Promise<EcardListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.customerId) params.set("customerId", query.customerId);

  return apiRequest<EcardListResponse>(
    `${EMPLOYEE_ECARDS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function getEcard(id: string): Promise<Ecard> {
  return apiRequest<Ecard>(`${EMPLOYEE_ECARDS_BASE_PATH}/${id}`, {
    method: "GET",
  });
}

export function createEcard(
  payload: CreateEcardAsEmployeePayload,
  files: EcardImageUpload[],
): Promise<Ecard> {
  return apiRequest<Ecard>(EMPLOYEE_ECARDS_BASE_PATH, {
    method: "POST",
    body: buildFormData(payload, files),
  });
}

export function updateEcard(
  id: string,
  payload: UpdateEcardPayload,
  files: EcardImageUpload[],
): Promise<Ecard> {
  return apiRequest<Ecard>(`${EMPLOYEE_ECARDS_BASE_PATH}/${id}`, {
    method: "PATCH",
    body: buildFormData(payload, files),
  });
}

export function deleteEcard(id: string): Promise<void> {
  return apiRequest<void>(`${EMPLOYEE_ECARDS_BASE_PATH}/${id}`, {
    method: "DELETE",
  });
}
