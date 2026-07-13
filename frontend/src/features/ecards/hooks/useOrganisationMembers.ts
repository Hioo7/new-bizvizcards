import { useEffect, useState } from "react";
import { listOrganisationMembersByCustomer } from "@services/organisationService";
import type { OrganisationMemberSummary } from "@app-types/ecard";

export interface UseOrganisationMembersResult {
  members: OrganisationMemberSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useOrganisationMembers(
  customerId: string,
): UseOrganisationMembersResult {
  const [members, setMembers] = useState<OrganisationMemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listOrganisationMembersByCustomer(customerId);
        if (cancelled) return;
        setMembers(response);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load team members.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return { members, isLoading, error };
}
