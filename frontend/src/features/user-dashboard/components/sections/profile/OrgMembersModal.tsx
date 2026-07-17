import { useState } from "react";
import type {
  OrgMemberListItem,
  OrgInvite,
  InviteMemberPayload,
  UpdateMemberPayload,
} from "@features/user-dashboard/types";

interface OrgMembersModalProps {
  open: boolean;
  isSpoc: boolean;
  currentCustomerId: string;
  members: OrgMemberListItem[];
  invites: OrgInvite[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onUpdateMember: (id: string, payload: UpdateMemberPayload) => Promise<void>;
  onRemoveMember: (id: string) => Promise<void>;
  onInvite: (payload: InviteMemberPayload) => Promise<void>;
  onRevokeInvite: (id: string) => Promise<void>;
}

function MemberCard({
  member,
  isSpoc,
  isSelf,
  onUpdate,
  onRemove,
}: {
  member: OrgMemberListItem;
  isSpoc: boolean;
  isSelf: boolean;
  onUpdate: (id: string, payload: UpdateMemberPayload) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isSuspended = member.status === "SUSPENDED";

  async function handleToggleSuspend() {
    setBusy(true);
    try {
      await onUpdate(member.id, {
        status: isSuspended ? "ACTIVE" : "SUSPENDED",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await onRemove(member.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            member.role === "SPOC"
              ? "bg-primary text-primary-content"
              : "bg-base-200 text-base-content/60"
          }`}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-base-content">
              {member.name}
              {isSelf && (
                <span className="ml-1 text-xs font-normal text-base-content/40">
                  (you)
                </span>
              )}
            </p>
            <span
              className={`badge badge-sm ${
                member.role === "SPOC" ? "badge-primary" : "badge-ghost border border-base-300"
              }`}
            >
              {member.role === "SPOC" ? "⭐ SPOC" : "Member"}
            </span>
            {isSuspended && (
              <span className="badge badge-sm badge-error">Suspended</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-base-content/50">{member.email}</p>
        </div>

        {/* Actions (SPOC only, not self) */}
        {isSpoc && !isSelf && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => void handleToggleSuspend()}
              disabled={busy}
              aria-label={isSuspended ? "Reactivate member" : "Suspend member"}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                isSuspended
                  ? "hover:bg-success/10 text-base-content/30 hover:text-success"
                  : "hover:bg-warning/10 text-base-content/30 hover:text-warning"
              }`}
            >
              {busy ? (
                <span className="loading loading-spinner loading-xs" />
              ) : isSuspended ? (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={busy}
              aria-label="Remove member"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-error/10 text-base-content/30 hover:text-error transition-colors"
            >
              {busy ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InviteRow({
  invite,
  onRevoke,
}: {
  invite: OrgInvite;
  onRevoke: (id: string) => Promise<void>;
}) {
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    setRevoking(true);
    try {
      await onRevoke(invite.id);
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-base-200 bg-base-100 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/30">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6" />
          <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-base-content/80">{invite.email}</p>
        <p className="text-xs text-base-content/40">
          Expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleRevoke()}
        disabled={revoking}
        className="shrink-0 rounded-lg border border-base-300 px-2.5 py-1 text-xs font-medium text-base-content/60 hover:bg-base-200 transition-colors disabled:opacity-60"
      >
        {revoking ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          "Revoke"
        )}
      </button>
    </div>
  );
}

export default function OrgMembersModal({
  open,
  isSpoc,
  currentCustomerId,
  members,
  invites,
  loading,
  error,
  onClose,
  onUpdateMember,
  onRemoveMember,
  onInvite,
  onRevokeInvite,
}: OrgMembersModalProps) {
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const q = search.toLowerCase();
  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
  );

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await onInvite({ email: inviteEmail.trim() });
      setInviteEmail("");
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to send invite",
      );
    } finally {
      setInviting(false);
    }
  }

  if (!open) return null;

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open>
      <div className="modal-box p-0 overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[80vh]">
        {/* Blue header */}
        <div
          className="shrink-0 px-5 pt-8 pb-5"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-2xl font-bold text-white">Members</h3>
              <p className="mt-0.5 text-sm text-white/70">
                Manage your organisation's members
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-white py-2.5 pl-9 pr-4 text-sm text-base-content outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-base-200/40">
          {error && (
            <p className="rounded-xl bg-error/10 px-4 py-2 text-sm text-error">
              {error}
            </p>
          )}

          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-base-100 border border-base-200 p-4 flex items-center gap-3">
                  <div className="skeleton h-12 w-12 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="skeleton h-3 w-36 rounded" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Members */}
              {filteredMembers.length === 0 ? (
                <p className="py-6 text-center text-sm text-base-content/40">
                  {search ? "No members match your search" : "No members yet"}
                </p>
              ) : (
                filteredMembers.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    isSpoc={isSpoc}
                    isSelf={m.customerId === currentCustomerId}
                    onUpdate={onUpdateMember}
                    onRemove={onRemoveMember}
                  />
                ))
              )}

              {/* Pending invites (SPOC only) */}
              {isSpoc && invites.length > 0 && (
                <div className="mt-2">
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-base-content/40">
                    Pending Invites ({invites.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {invites.map((inv) => (
                      <InviteRow
                        key={inv.id}
                        invite={inv}
                        onRevoke={onRevokeInvite}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Invite form footer (SPOC only) */}
        {isSpoc && (
          <div className="border-t border-base-300 bg-base-100 px-4 py-4 shrink-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/40">
              Invite by Email
            </p>
            <form onSubmit={(e) => void handleInvite(e)} className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 rounded-xl border border-base-300 bg-base-200/50 px-3 py-2.5 text-sm text-base-content outline-none placeholder:text-base-content/30 focus:border-primary"
              />
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-content transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {inviting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Invite"
                )}
              </button>
            </form>
            {inviteError && (
              <p className="mt-1.5 text-xs text-error">{inviteError}</p>
            )}
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
