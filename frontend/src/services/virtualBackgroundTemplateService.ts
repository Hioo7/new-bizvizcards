import { EMPLOYEE_VIRTUAL_BACKGROUND_TEMPLATES_BASE_PATH } from "@config/api";
import {
  VIRTUAL_BACKGROUND_TEMPLATE_IMAGE_FIELD,
  VIRTUAL_BACKGROUND_MULTIPART_DATA_FIELD,
} from "@features/virtual-backgrounds/config";
import { apiRequest } from "@services/apiClient";
import type { VirtualBackgroundTemplateSummary } from "@app-types/virtualBackground";

export function listVirtualBackgroundTemplates(): Promise<
  VirtualBackgroundTemplateSummary[]
> {
  return apiRequest<VirtualBackgroundTemplateSummary[]>(
    EMPLOYEE_VIRTUAL_BACKGROUND_TEMPLATES_BASE_PATH,
    { method: "GET" },
  );
}

export function createVirtualBackgroundTemplate(
  name: string,
  image: File,
): Promise<VirtualBackgroundTemplateSummary> {
  const formData = new FormData();
  formData.set(VIRTUAL_BACKGROUND_MULTIPART_DATA_FIELD, JSON.stringify({ name }));
  formData.set(VIRTUAL_BACKGROUND_TEMPLATE_IMAGE_FIELD, image);

  return apiRequest<VirtualBackgroundTemplateSummary>(
    EMPLOYEE_VIRTUAL_BACKGROUND_TEMPLATES_BASE_PATH,
    { method: "POST", body: formData },
  );
}

export function deleteVirtualBackgroundTemplate(id: string): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_VIRTUAL_BACKGROUND_TEMPLATES_BASE_PATH}/${id}`,
    { method: "DELETE" },
  );
}
