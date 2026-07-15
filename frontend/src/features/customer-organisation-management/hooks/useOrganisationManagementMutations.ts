import { useMemo } from "react";
import { createOrganisation } from "@services/organisationService";
import type {
  CreateOrganisationPayload,
  CreateOrganisationResponse,
} from "@app-types/organisation";

export interface UseOrganisationManagementMutationsResult {
  createOrganisation: (
    payload: CreateOrganisationPayload,
  ) => Promise<CreateOrganisationResponse>;
}

export function useOrganisationManagementMutations(
  refetch: () => void,
): UseOrganisationManagementMutationsResult {
  return useMemo(
    () => ({
      createOrganisation: async (payload) => {
        const result = await createOrganisation(payload);
        refetch();
        return result;
      },
    }),
    [refetch],
  );
}
