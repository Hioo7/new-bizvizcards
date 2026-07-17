import { useState } from "react";
import type { OrgMemberListItem, UpdateMemberPayload } from "@features/user-dashboard/types";

interface OrgMembersTabProps {
  members: OrgMemberListItem[];
  search: string;
  isSpoc: boolean;
  currentCustomerId: string;
  onUpdate: (id: string, payload: UpdateMemberPayload) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onShowEcards: (member: OrgMemberListItem) => void;
}

function MemberCard({
  member,
  isSpoc,
  isSelf,
  onUpdate,
  onRemove,
  onShowEcards,
}: {
  member: OrgMemberListItem;
  isSpoc: boolean;
  isSelf: boolean;
  onUpdate: (id: string, payload: UpdateMemberPayload) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onShowEcards: (member: OrgMemberListItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isSuspended = member.status === "SUSPENDED";

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasEcard = member.linkedEcard !== null;
  const exchangeEnabled = member.linkedEcard?.isExchangeContactEnabled ?? false;

  async function handleRemove() {
    setBusy(true);
    try {
      await onRemove(member.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-base-100 border border-base-200 shadow-sm overflow-hidden">
      {/* Main row */}
      <div className="flex items-start gap-4 px-4 pt-4 pb-3">
        {/* Avatar */}
        {member.profilePicture ? (
          <img
            src={member.profilePicture}
            alt={member.name}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-content">
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold text-base-content">
              {member.name}
              {isSelf && (
                <span className="ml-1 text-xs font-normal text-base-content/40">(you)</span>
              )}
            </p>
            {member.role === "SPOC" ? (
              <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning border border-warning/30">
                ⭐ SPOC
              </span>
            ) : (
              <span className="rounded-full border border-base-300 px-2.5 py-0.5 text-xs font-medium text-base-content/60">
                Member
              </span>
            )}
            {isSuspended && (
              <span className="rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-semibold text-error">
                Suspended
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-base-content/50">{member.email}</p>

          {/* Status badges */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-semibold ${
                hasEcard
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-base-300 bg-base-200 text-base-content/40"
              }`}
            >
              {hasEcard ? (
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              E-Card {hasEcard ? "On" : "Off"}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-semibold ${
                exchangeEnabled
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-base-300 bg-base-200 text-base-content/40"
              }`}
            >
              {exchangeEnabled ? (
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              Exchange {exchangeEnabled ? "On" : "Off"}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex shrink-0 flex-col gap-1 items-end mt-0.5">
          {isSpoc && !isSelf && (
            <button
              type="button"
              onClick={() => setEditOpen((v) => !v)}
              aria-label="Edit member"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                editOpen
                  ? "bg-primary text-primary-content"
                  : "hover:bg-base-200 text-primary/60 hover:text-primary"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Inline member edit panel */}
      {editOpen && isSpoc && !isSelf && (
        <div className="border-t border-base-200 bg-base-50 px-4 py-3 flex flex-col gap-3">
          {/* Role */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-base-content/60">Role</p>
            <div className="flex gap-1.5">
              {(["MEMBER", "SPOC"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={busy || member.role === r}
                  onClick={async () => {
                    setBusy(true);
                    try { await onUpdate(member.id, { role: r }); } finally { setBusy(false); }
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    member.role === r
                      ? "bg-primary text-primary-content"
                      : "border border-base-300 text-base-content/60 hover:border-primary hover:text-primary"
                  }`}
                >
                  {r === "SPOC" ? "⭐ SPOC" : "Member"}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-base-content/60">Status</p>
            <div className="flex gap-1.5">
              {(["ACTIVE", "SUSPENDED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy || member.status === s}
                  onClick={async () => {
                    setBusy(true);
                    try { await onUpdate(member.id, { status: s }); } finally { setBusy(false); }
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    member.status === s
                      ? s === "SUSPENDED"
                        ? "bg-error text-white"
                        : "bg-success text-white"
                      : "border border-base-300 text-base-content/60 hover:border-primary hover:text-primary"
                  }`}
                >
                  {s === "ACTIVE" ? "Active" : "Suspended"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex items-center gap-2 border-t border-base-100 bg-base-50 px-4 py-2">
        {/* Suspend / Reactivate + Remove — SPOC only, non-self */}
        {isSpoc && !isSelf && (
          <>
            <button
              type="button"
              onClick={async () => {
                setBusy(true);
                try {
                  await onUpdate(member.id, {
                    status: isSuspended ? "ACTIVE" : "SUSPENDED",
                  });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              aria-label={isSuspended ? "Reactivate member" : "Suspend member"}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-base-300 bg-base-100 text-base-content/40 hover:text-warning hover:border-warning transition-colors"
            >
              {busy ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M16 11V7a4 4 0 00-8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="2" y="11" width="20" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={busy}
              aria-label="Remove member"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-base-300 bg-base-100 text-base-content/40 hover:text-error hover:border-error transition-colors"
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
          </>
        )}

        {/* Card icon — always shown, opens ecard sheet — pushed to right */}
        <button
          type="button"
          onClick={() => onShowEcards(member)}
          aria-label="View e-cards"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-base-300 bg-base-100 text-base-content/40 hover:text-primary hover:border-primary transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M6 15h4M6 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function OrgMembersTab({
  members,
  search,
  isSpoc,
  currentCustomerId,
  onUpdate,
  onRemove,
  onShowEcards,
}: OrgMembersTabProps) {
  const q = search.toLowerCase();
  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-base-content/30" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <p className="text-sm font-medium text-base-content/60">
          {search ? "No members match your search" : "No members yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((m) => (
        <MemberCard
          key={m.id}
          member={m}
          isSpoc={isSpoc}
          isSelf={m.customerId === currentCustomerId}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onShowEcards={onShowEcards}
        />
      ))}
    </div>
  );
}
