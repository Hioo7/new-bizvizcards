import { REDIRECTS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  CreateExternalRedirectPayload,
  CreateInternalRedirectPayload,
  CreateRestrictedPathPayload,
  ExternalRedirect,
  InternalRedirect,
  RestrictedPath,
  UpdateExternalRedirectPayload,
  UpdateInternalRedirectPayload,
} from "@features/redirects/types/redirects.types";

const INTERNAL_PATH = `${REDIRECTS_BASE_PATH}/internal`;
const EXTERNAL_PATH = `${REDIRECTS_BASE_PATH}/external`;
const RESTRICTED_PATHS_PATH = `${REDIRECTS_BASE_PATH}/restricted-paths`;

export function listInternalRedirects(): Promise<InternalRedirect[]> {
  return apiRequest<InternalRedirect[]>(INTERNAL_PATH, { method: "GET" });
}

export function createInternalRedirect(
  payload: CreateInternalRedirectPayload,
): Promise<InternalRedirect> {
  return apiRequest<InternalRedirect>(INTERNAL_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInternalRedirect(
  id: string,
  payload: UpdateInternalRedirectPayload,
): Promise<InternalRedirect> {
  return apiRequest<InternalRedirect>(`${INTERNAL_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteInternalRedirect(id: string): Promise<void> {
  return apiRequest<void>(`${INTERNAL_PATH}/${id}`, { method: "DELETE" });
}

export function listExternalRedirects(): Promise<ExternalRedirect[]> {
  return apiRequest<ExternalRedirect[]>(EXTERNAL_PATH, { method: "GET" });
}

export function createExternalRedirect(
  payload: CreateExternalRedirectPayload,
): Promise<ExternalRedirect> {
  return apiRequest<ExternalRedirect>(EXTERNAL_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExternalRedirect(
  id: string,
  payload: UpdateExternalRedirectPayload,
): Promise<ExternalRedirect> {
  return apiRequest<ExternalRedirect>(`${EXTERNAL_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteExternalRedirect(id: string): Promise<void> {
  return apiRequest<void>(`${EXTERNAL_PATH}/${id}`, { method: "DELETE" });
}

export function listRestrictedPaths(): Promise<RestrictedPath[]> {
  return apiRequest<RestrictedPath[]>(RESTRICTED_PATHS_PATH, {
    method: "GET",
  });
}

export function createRestrictedPath(
  payload: CreateRestrictedPathPayload,
): Promise<RestrictedPath> {
  return apiRequest<RestrictedPath>(RESTRICTED_PATHS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteRestrictedPath(id: string): Promise<void> {
  return apiRequest<void>(`${RESTRICTED_PATHS_PATH}/${id}`, {
    method: "DELETE",
  });
}
