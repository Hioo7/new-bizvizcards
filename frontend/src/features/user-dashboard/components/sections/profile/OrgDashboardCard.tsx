import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@config/routes";
import type { OrganisationWithMembership } from "@features/user-dashboard/types";

interface OrgDashboardCardProps {
  data: OrganisationWithMembership | null;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
  onCreateOrg: () => void;
  onUpdateName: (name: string) => Promise<void>;
}

export default function OrgDashboardCard({
  data,
  loading,
  error,
  isAvailable,
  onCreateOrg,
  onUpdateName,
}: OrgDashboardCardProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isSpoc = data?.membership.role === "SPOC";

  function startEdit() {
    setEditName(data?.organisation.name ?? "");
    setSaveError(null);
    setEditing(true);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onUpdateName(editName.trim());
      setEditing(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to update name",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ── Not available on plan ────────────────────────────────────────────── */
  if (!isAvailable) {
    return (
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4 flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-200">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-base-content/30" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-base-content/60">Organisation not available on your plan</p>
          <p className="mt-0.5 text-xs text-base-content/40">Upgrade your plan to access this feature</p>
        </div>
      </div>
    );
  }

  /* ── Loading skeleton ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4">
        <p className="text-sm text-error">{error}</p>
      </div>
    );
  }

  /* ── No organisation ──────────────────────────────────────────────────── */
  if (!data) {
    return (
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-base-200">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-base-content/40"
              aria-hidden="true"
            >
              <path
                d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 21V12h6v9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-base-content">
              Organisation
            </h2>
            <p className="text-sm text-base-content/50">
              Not part of any organisation yet
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreateOrg}
          className="btn btn-primary w-full min-h-[44px] rounded-xl text-sm font-semibold"
        >
          Create Organisation
        </button>
      </div>
    );
  }

  /* ── Has organisation ─────────────────────────────────────────────────── */
  const { organisation, membership } = data;

  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-primary"
            aria-hidden="true"
          >
            <path
              d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 21V12h6v9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">
              Organisation
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isSpoc
                  ? "bg-primary/10 text-primary"
                  : "bg-base-200 text-base-content/50"
              }`}
            >
              {isSpoc ? "Admin" : "Member"}
            </span>
          </div>
          <p className="text-base font-bold text-base-content truncate">
            {organisation.name}
          </p>
        </div>

        {isSpoc && !editing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit organisation name"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-base-200 text-base-content/40"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Edit name form (SPOC only) */}
      {editing && (
        <form
          onSubmit={(e) => void handleSaveName(e)}
          className="flex flex-col gap-3"
        >
          <div className="rounded-xl border border-base-300 bg-base-200/50 px-3 py-2">
            <label
              htmlFor="org-edit-name"
              className="text-xs font-medium text-base-content/50"
            >
              Organisation name
            </label>
            <input
              id="org-edit-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-sm font-medium text-base-content outline-none"
              autoFocus
            />
          </div>
          {saveError && (
            <p className="text-xs text-error">{saveError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex-1 rounded-xl border border-base-300 py-2.5 text-sm font-semibold text-base-content hover:bg-base-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !editName.trim()}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-content transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Status badge when suspended */}
      {!editing && membership.status === "SUSPENDED" && (
        <div className="flex items-center gap-2 rounded-xl bg-error/10 px-3 py-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 shrink-0 text-error"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-xs text-error font-medium">
            Your membership is currently suspended
          </p>
        </div>
      )}

      {/* Members button */}
      {!editing && (
        <button
          type="button"
          onClick={() => navigate(ROUTES.orgDashboard)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-base-300 py-2.5 text-sm font-medium text-base-content/70 hover:bg-base-200 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="9"
              cy="7"
              r="4"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M23 21v-2a4 4 0 00-3-3.87"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 3.13a4 4 0 010 7.75"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          View Members
        </button>
      )}
    </div>
  );
}
