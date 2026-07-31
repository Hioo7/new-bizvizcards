import { useEffect, useState } from "react";
import {
  listMyOrganisationMembers,
  listOrganisationMembers,
} from "@services/organisationService";
import type { OrganisationMemberSummary } from "@app-types/ecard";

// "employee" hits the admin-only members endpoint (used from the admin
// e-card policy builder); "customer" hits the customer/SPOC-scoped endpoint
// (used from every customer-authenticated Team component — the customer's
// own e-card builder, the org member e-card edit modal, and the customer's
// own e-card policy tab). Getting this wrong 401s, since the two auth scopes
// don't share sessions — see useOrganisationMembers.ts's callers.
export type OrganisationMembersScope = "employee" | "customer";

export interface UseOrganisationMembersResult {
  members: OrganisationMemberSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useOrganisationMembers(
  organisationId: string | null,
  scope: OrganisationMembersScope,
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
        const response =
          scope === "employee"
            ? await listOrganisationMembers(organisationId as string)
            : await listMyOrganisationMembers(organisationId as string);
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
  }, [organisationId, scope]);

  return { members, isLoading, error };
}
