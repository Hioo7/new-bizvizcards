import { STAFF_MANAGEMENT_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  BanStaffPayload,
  CreateStaffPayload,
  ListStaffQuery,
  SetStaffRolePayload,
  StaffListResponse,
  StaffMember,
  UpdateStaffNamePayload,
} from "@app-types/staffAuth";

export function listStaff(query: ListStaffQuery): Promise<StaffListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);

  return apiRequest<StaffListResponse>(
    `${STAFF_MANAGEMENT_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function createStaff(
  payload: CreateStaffPayload,
): Promise<{ staff: StaffMember }> {
  return apiRequest<{ staff: StaffMember }>(STAFF_MANAGEMENT_BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStaffName(
  id: string,
  payload: UpdateStaffNamePayload,
): Promise<{ staff: StaffMember }> {
  return apiRequest<{ staff: StaffMember }>(
    `${STAFF_MANAGEMENT_BASE_PATH}/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function setStaffRole(
  id: string,
  payload: SetStaffRolePayload,
): Promise<{ staff: StaffMember }> {
  return apiRequest<{ staff: StaffMember }>(
    `${STAFF_MANAGEMENT_BASE_PATH}/${id}/role`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function banStaff(
  id: string,
  payload: BanStaffPayload,
): Promise<{ staff: StaffMember }> {
  return apiRequest<{ staff: StaffMember }>(
    `${STAFF_MANAGEMENT_BASE_PATH}/${id}/ban`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function unbanStaff(id: string): Promise<{ staff: StaffMember }> {
  return apiRequest<{ staff: StaffMember }>(
    `${STAFF_MANAGEMENT_BASE_PATH}/${id}/unban`,
    { method: "POST" },
  );
}

export function deleteStaff(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `${STAFF_MANAGEMENT_BASE_PATH}/${id}`,
    { method: "DELETE" },
  );
}
