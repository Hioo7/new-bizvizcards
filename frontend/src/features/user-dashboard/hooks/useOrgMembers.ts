import { useState, useCallback } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type {
  OrgMemberListItem,
  OrgInvite,
  InviteMemberPayload,
  UpdateMemberPayload,
} from "@features/user-dashboard/types";

interface UseOrgMembersReturn {
  members: OrgMemberListItem[];
  invites: OrgInvite[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  updateMember: (id: string, payload: UpdateMemberPayload) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  invite: (payload: InviteMemberPayload) => Promise<void>;
  revokeInvite: (id: string) => Promise<void>;
}

export function useOrgMembers(): UseOrgMembersReturn {
  const [members, setMembers] = useState<OrgMemberListItem[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedMembers, fetchedInvites] = await Promise.all([
        userDashboardService.listOrgMembers(),
        userDashboardService.listOrgInvites(),
      ]);
      setMembers(fetchedMembers);
      setInvites(fetchedInvites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMember = useCallback(
    async (id: string, payload: UpdateMemberPayload) => {
      await userDashboardService.updateOrgMember(id, payload);
      // Merge changes into local state (role/status only — name/email unchanged)
      setMembers((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                ...(payload.role !== undefined && { role: payload.role }),
                ...(payload.status !== undefined && {
                  status: payload.status,
                }),
              }
            : m,
        ),
      );
    },
    [],
  );

  const removeMember = useCallback(async (id: string) => {
    await userDashboardService.removeOrgMember(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const invite = useCallback(async (payload: InviteMemberPayload) => {
    const newInvite = await userDashboardService.inviteOrgMember(payload);
    setInvites((prev) => [newInvite, ...prev]);
  }, []);

  const revokeInvite = useCallback(async (id: string) => {
    await userDashboardService.revokeOrgInvite(id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return {
    members,
    invites,
    loading,
    error,
    load,
    updateMember,
    removeMember,
    invite,
    revokeInvite,
  };
}
