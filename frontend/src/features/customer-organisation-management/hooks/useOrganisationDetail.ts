import { useCallback, useEffect, useState } from "react";
import {
  getOrganisation,
  listOrganisationMembers,
} from "@services/organisationService";
import type { OrganisationMemberSummary } from "@app-types/ecard";
import type { OrganisationSummary } from "@app-types/organisation";

export interface UseOrganisationDetailResult {
  organisation: OrganisationSummary | null;
  members: OrganisationMemberSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrganisationDetail(
  organisationId: string,
): UseOrganisationDetailResult {
  const [organisation, setOrganisation] = useState<OrganisationSummary | null>(
    null,
  );
  const [members, setMembers] = useState<OrganisationMemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const [org, roster] = await Promise.all([
          getOrganisation(organisationId),
          listOrganisationMembers(organisationId),
        ]);
        if (cancelled) return;
        setOrganisation(org);
        setMembers(roster);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load organisation.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [organisationId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { organisation, members, isLoading, error, refetch };
}
