import { useCallback, useEffect, useState } from "react";
import {
  createAndLinkInviteMember,
  linkExistingInviteMember,
  listOrganisationInvites,
  revokeOrganisationInviteAsEmployee,
} from "@services/organisationService";
import type {
  CreateAndLinkInviteMemberPayload,
  OrganisationInviteAdminItem,
} from "@app-types/organisation";

export interface UseOrganisationInvitesResult {
  invites: OrganisationInviteAdminItem[];
  isLoading: boolean;
  error: string | null;
  linkExisting: (inviteId: string, customerId: string) => Promise<void>;
  createAndLink: (
    inviteId: string,
    payload: CreateAndLinkInviteMemberPayload,
  ) => Promise<void>;
  revoke: (inviteId: string) => Promise<void>;
}

// `onMemberResolved` lets the caller also refresh its Members list — linking
// or creating an account through an invite adds a new organisation member.
export function useOrganisationInvites(
  organisationId: string,
  onMemberResolved: () => void,
): UseOrganisationInvitesResult {
  const [invites, setInvites] = useState<OrganisationInviteAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listOrganisationInvites(organisationId);
        if (!cancelled) setInvites(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load invites.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [organisationId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  const linkExisting = useCallback(
    async (inviteId: string, customerId: string) => {
      await linkExistingInviteMember(organisationId, inviteId, customerId);
      refetch();
      onMemberResolved();
    },
    [organisationId, refetch, onMemberResolved],
  );

  const createAndLink = useCallback(
    async (inviteId: string, payload: CreateAndLinkInviteMemberPayload) => {
      await createAndLinkInviteMember(organisationId, inviteId, payload);
      refetch();
      onMemberResolved();
    },
    [organisationId, refetch, onMemberResolved],
  );

  const revoke = useCallback(
    async (inviteId: string) => {
      await revokeOrganisationInviteAsEmployee(organisationId, inviteId);
      refetch();
    },
    [organisationId, refetch],
  );

  return { invites, isLoading, error, linkExisting, createAndLink, revoke };
}
