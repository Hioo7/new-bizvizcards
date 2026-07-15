import { EMPLOYEE_ORGANISATIONS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { Ecard, OrganisationMemberSummary } from "@app-types/ecard";
import type {
  AddedOrganisationMember,
  AddOrganisationMemberPayload,
  CreateOrganisationPayload,
  CreateOrganisationResponse,
  CustomerOrganisationMembership,
  ListOrganisationsQuery,
  OrganisationListResponse,
  OrganisationSummary,
  UpdateOrganisationLogoResponse,
  UpdateOrganisationMemberPayload,
  UpdateOrganisationPayload,
} from "@app-types/organisation";

export function listCustomerOrganisationMemberships(
  customerId: string,
): Promise<CustomerOrganisationMembership[]> {
  return apiRequest<CustomerOrganisationMembership[]>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/by-customer/${customerId}`,
    { method: "GET" },
  );
}

export function listOrganisationMembers(
  organisationId: string,
): Promise<OrganisationMemberSummary[]> {
  return apiRequest<OrganisationMemberSummary[]>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/members`,
    { method: "GET" },
  );
}

export function listOrganisations(
  query: ListOrganisationsQuery,
): Promise<OrganisationListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set("search", query.search);

  return apiRequest<OrganisationListResponse>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function createOrganisation(
  payload: CreateOrganisationPayload,
): Promise<CreateOrganisationResponse> {
  return apiRequest<CreateOrganisationResponse>(
    EMPLOYEE_ORGANISATIONS_BASE_PATH,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function getOrganisation(id: string): Promise<OrganisationSummary> {
  return apiRequest<OrganisationSummary>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${id}`,
    { method: "GET" },
  );
}

export function updateOrganisation(
  id: string,
  payload: UpdateOrganisationPayload,
): Promise<OrganisationSummary> {
  return apiRequest<OrganisationSummary>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function updateOrganisationLogo(
  id: string,
  file: File,
): Promise<UpdateOrganisationLogoResponse> {
  const formData = new FormData();
  formData.set("file", file);
  return apiRequest<UpdateOrganisationLogoResponse>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${id}/logo`,
    { method: "PATCH", body: formData },
  );
}

export function removeOrganisationLogo(
  id: string,
): Promise<{ logoMediaId: string | null }> {
  return apiRequest<{ logoMediaId: string | null }>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${id}/logo`,
    { method: "DELETE" },
  );
}

export function deleteOrganisation(id: string): Promise<void> {
  return apiRequest<void>(`${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${id}`, {
    method: "DELETE",
  });
}

export function addOrganisationMembers(
  organisationId: string,
  payload: AddOrganisationMemberPayload,
): Promise<AddedOrganisationMember[]> {
  return apiRequest<AddedOrganisationMember[]>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/members`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateOrganisationMember(
  memberId: string,
  payload: UpdateOrganisationMemberPayload,
): Promise<OrganisationMemberSummary> {
  return apiRequest<OrganisationMemberSummary>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/members/${memberId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function removeOrganisationMember(memberId: string): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/members/${memberId}`,
    { method: "DELETE" },
  );
}

export function linkMemberEcard(
  organisationId: string,
  memberId: string,
  ecardId: string,
): Promise<Ecard> {
  return apiRequest<Ecard>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/${organisationId}/members/${memberId}/ecard`,
    { method: "PATCH", body: JSON.stringify({ ecardId }) },
  );
}
