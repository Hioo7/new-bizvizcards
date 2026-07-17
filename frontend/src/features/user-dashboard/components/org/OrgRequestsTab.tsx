import { useState } from "react";
import type { OrgInvite, InviteMemberPayload } from "@features/user-dashboard/types";

interface OrgRequestsTabProps {
  isSpoc: boolean;
  invites: OrgInvite[];
  onInvite: (payload: InviteMemberPayload) => Promise<void>;
  onRevoke: (id: string) => Promise<void>;
}

function InviteCard({
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
    <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/30">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6" />
          <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-base-content">{invite.email}</p>
        <p className="text-xs text-base-content/40">
          Invited · Expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <span className="badge badge-sm badge-warning shrink-0">Pending</span>
      <button
        type="button"
        onClick={() => void handleRevoke()}
        disabled={revoking}
        aria-label="Revoke invite"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-error/10 text-base-content/30 hover:text-error transition-colors"
      >
        {revoking ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function OrgRequestsTab({
  isSpoc,
  invites,
  onInvite,
  onRevoke,
}: OrgRequestsTabProps) {
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError(null);
    setSuccess(false);
    try {
      await onInvite({ email: email.trim() });
      setEmail("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Invite form (SPOC only) */}
      {isSpoc && (
        <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm p-4">
          <h3 className="mb-3 text-sm font-bold text-base-content">
            Invite a Member
          </h3>
          <form onSubmit={(e) => void handleInvite(e)} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 rounded-xl border border-base-300 bg-base-200/50 px-3 py-2.5 text-sm text-base-content outline-none placeholder:text-base-content/30 focus:border-primary"
            />
            <button
              type="submit"
              disabled={inviting || !email.trim()}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {inviting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Send"
              )}
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-error">{error}</p>}
          {success && (
            <p className="mt-2 text-xs text-success">Invite sent successfully!</p>
          )}
        </div>
      )}

      {/* Pending invites list */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/40">
          Pending Invites ({invites.length})
        </p>
        {invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-base-content/30" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6" />
                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-base-content/60">No pending invites</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {invites.map((inv) => (
              <InviteCard key={inv.id} invite={inv} onRevoke={onRevoke} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
