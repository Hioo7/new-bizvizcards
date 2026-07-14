import { useEffect, useState } from "react";
import { listOrganisationMembers } from "@services/organisationService";
import type { OrganisationMemberSummary } from "@app-types/ecard";

export interface UseOrganisationMembersResult {
  members: OrganisationMemberSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useOrganisationMembers(
  organisationId: string | null,
): UseOrganisationMembersResult {
  const [members, setMembers] = useState<OrganisationMemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(organisationId !== null);
  const [error, setError] = useState<string | null>(null);

  // Tracks which organisationId the current `members` was last reset for, so
  // a prop change back to null (no organisation linked) can reset
  // synchronously during render — React's documented "adjust state when a
  // prop changes" pattern — rather than via an effect, since it's a pure,
  // synchronous reset with no async work involved.
  const [resetForId, setResetForId] = useState(organisationId);
  if (organisationId !== resetForId && organisationId === null) {
    setResetForId(null);
    setMembers([]);
    setIsLoading(false);
    setError(null);
  }

  useEffect(() => {
    if (organisationId === null) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listOrganisationMembers(
          organisationId as string,
        );
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
  }, [organisationId]);

  return { members, isLoading, error };
}
