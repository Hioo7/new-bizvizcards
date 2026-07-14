import { EMPLOYEE_ORGANISATIONS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { OrganisationMemberSummary } from "@app-types/ecard";
import type { CustomerOrganisationMembership } from "@app-types/organisation";

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
