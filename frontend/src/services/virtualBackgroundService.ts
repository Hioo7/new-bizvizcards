import { VIRTUAL_BACKGROUNDS_BASE_PATH } from "@config/api";
import {
  VIRTUAL_BACKGROUND_CUSTOM_IMAGE_FIELD,
  VIRTUAL_BACKGROUND_MULTIPART_DATA_FIELD,
} from "@features/virtual-backgrounds/config";
import { apiRequest } from "@services/apiClient";
import type {
  CreateVirtualBackgroundPayload,
  VirtualBackgroundSummary,
  VirtualBackgroundTemplateSummary,
} from "@app-types/virtualBackground";

export function listAvailableVirtualBackgroundTemplates(): Promise<
  VirtualBackgroundTemplateSummary[]
> {
  return apiRequest<VirtualBackgroundTemplateSummary[]>(
    `${VIRTUAL_BACKGROUNDS_BASE_PATH}/templates`,
    { method: "GET" },
  );
}

export function listVirtualBackgrounds(): Promise<VirtualBackgroundSummary[]> {
  return apiRequest<VirtualBackgroundSummary[]>(VIRTUAL_BACKGROUNDS_BASE_PATH, {
    method: "GET",
  });
}

export function createVirtualBackground(
  payload: CreateVirtualBackgroundPayload,
  customImage: File | undefined,
): Promise<VirtualBackgroundSummary> {
  const formData = new FormData();
  formData.set(VIRTUAL_BACKGROUND_MULTIPART_DATA_FIELD, JSON.stringify(payload));
  if (customImage) {
    formData.set(VIRTUAL_BACKGROUND_CUSTOM_IMAGE_FIELD, customImage);
  }

  return apiRequest<VirtualBackgroundSummary>(VIRTUAL_BACKGROUNDS_BASE_PATH, {
    method: "POST",
    body: formData,
  });
}

export function deleteVirtualBackground(id: string): Promise<void> {
  return apiRequest<void>(`${VIRTUAL_BACKGROUNDS_BASE_PATH}/${id}`, {
    method: "DELETE",
  });
}
