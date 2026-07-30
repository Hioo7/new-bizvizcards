import { EMPLOYEE_ORGANISATIONS_BASE_PATH, ORGANISATIONS_BASE_PATH } from "@config/api";
import { ECARD_MULTIPART_DATA_FIELD } from "@config/ecardFields";
import { apiRequest } from "@services/apiClient";
import type {
  OrganisationEcardTemplate,
  OrganisationEcardTemplateImageUpload,
  OrganisationEcardTemplatePayload,
} from "@app-types/organisationEcardTemplate";

function buildFormData(
  payload: OrganisationEcardTemplatePayload,
  files: OrganisationEcardTemplateImageUpload[],
): FormData {
  const formData = new FormData();
  formData.set(ECARD_MULTIPART_DATA_FIELD, JSON.stringify(payload));
  for (const upload of files) {
    formData.set(upload.fieldName, upload.file);
  }
  return formData;
}

export function getOrganisationEcardTemplate(
  organisationId: string,
): Promise<OrganisationEcardTemplate | null> {
  return apiRequest<OrganisationEcardTemplate | null>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/ecard-template`,
    { method: "GET" },
  );
}

// Member-read variant — used by the customer's own e-card builder to preview
// which of its own accent colors (if any) the linked organisation locks.
export function getMyOrganisationEcardTemplate(
  organisationId: string,
): Promise<OrganisationEcardTemplate | null> {
  return apiRequest<OrganisationEcardTemplate | null>(
    `${ORGANISATIONS_BASE_PATH}/${organisationId}/ecard-template`,
    { method: "GET" },
  );
}

export function updateOrganisationEcardTemplate(
  organisationId: string,
  payload: OrganisationEcardTemplatePayload,
  files: OrganisationEcardTemplateImageUpload[],
): Promise<OrganisationEcardTemplate> {
  return apiRequest<OrganisationEcardTemplate>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/ecard-template`,
    { method: "PUT", body: buildFormData(payload, files) },
  );
}

export function deleteOrganisationEcardTemplate(
  organisationId: string,
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/ecard-template`,
    { method: "DELETE" },
  );
}
