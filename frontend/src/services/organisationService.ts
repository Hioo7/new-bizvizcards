import { EMPLOYEE_ORGANISATIONS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type { OrganisationMemberSummary } from "@app-types/ecard";

export function listOrganisationMembersByCustomer(
  customerId: string,
): Promise<OrganisationMemberSummary[]> {
  return apiRequest<OrganisationMemberSummary[]>(
    `${EMPLOYEE_ORGANISATIONS_BASE_PATH}/by-customer/${customerId}/members`,
    { method: "GET" },
  );
}
