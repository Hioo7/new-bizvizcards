import { useState } from "react";
import type {
  LeadReminder,
  CreateLeadReminderPayload,
  UpdateLeadReminderPayload,
} from "@features/user-dashboard/types";

interface LeadRemindersTabProps {
  reminders: LeadReminder[];
  loading: boolean;
  error: string | null;
  onCreate: (payload: CreateLeadReminderPayload) => Promise<void>;
  onUpdate: (
    reminderId: string,
    payload: UpdateLeadReminderPayload,
  ) => Promise<void>;
  onDelete: (reminderId: string) => Promise<void>;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ReminderItem({
  reminder,
  onUpdate,
  onDelete,
}: {
  reminder: LeadReminder;
  onUpdate: (id: string, payload: UpdateLeadReminderPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(reminder.title);
  const [editText, setEditText] = useState(reminder.text ?? "");
  const [editTriggerAt, setEditTriggerAt] = useState(
    reminder.triggerAt ? reminder.triggerAt.slice(0, 16) : "",
  );
  const [saving, setSaving] = useState(false);

  const isDone = reminder.status !== "PENDING";

  function openEdit() {
    setEditTitle(reminder.title);
    setEditText(reminder.text ?? "");
    setEditTriggerAt(reminder.triggerAt ? reminder.triggerAt.slice(0, 16) : "");
    setEditing(true);
  }

  async function handleSave() {
    if (!editTitle.trim() || !editTriggerAt) return;
    setSaving(true);
    try {
      await onUpdate(reminder.id, {
        title: editTitle.trim(),
        text: editText.trim() || null,
        triggerAt: new Date(editTriggerAt).toISOString(),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDone() {
    setToggling(true);
    try {
      await onUpdate(reminder.id, { status: isDone ? "PENDING" : "DISMISSED" });
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(reminder.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border shadow-sm overflow-hidden transition-opacity ${
        isDone && !editing ? "border-base-300 bg-base-100 opacity-60" : "border-base-300 bg-base-100"
      }`}
    >
      {/* Card header */}
      <div
        className={`flex items-center gap-2 border-b border-base-200 px-3 py-2 ${
          editing ? "bg-warning/5" : isDone ? "bg-success/5" : "bg-warning/5"
        }`}
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            editing ? "bg-warning/15" : isDone ? "bg-success/15" : "bg-warning/15"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`h-3.5 w-3.5 ${editing ? "text-warning" : isDone ? "text-success" : "text-warning"}`}
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <span
          className={`flex-1 text-xs font-medium ${
            editing ? "text-warning" : isDone ? "text-success" : "text-warning"
          }`}
        >
          {editing ? "Edit reminder" : isDone ? "Done" : "Pending"}
        </span>
        {!editing && (
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={openEdit}
              aria-label="Edit reminder"
              className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-warning/10 text-base-content/40 hover:text-warning transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              aria-label="Delete reminder"
              className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-error/10 text-base-content/40 hover:text-error transition-colors"
            >
              {deleting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      {editing ? (
        <div className="p-3 flex flex-col gap-2">
          <div className="rounded-xl bg-base-200/60 px-3 py-2">
            <label className="text-xs font-medium text-base-content/50">Title *</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Follow up call"
              className="mt-0.5 w-full bg-transparent text-sm font-medium text-base-content outline-none placeholder:text-base-content/30"
              autoFocus
            />
          </div>
          <div className="rounded-xl bg-base-200/60 px-3 py-2">
            <label className="text-xs font-medium text-base-content/50">Date &amp; Time *</label>
            <input
              type="datetime-local"
              value={editTriggerAt}
              onChange={(e) => setEditTriggerAt(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-sm font-medium text-base-content outline-none"
            />
          </div>
          <div className="rounded-xl bg-base-200/60 px-3 py-2">
            <label className="text-xs font-medium text-base-content/50">Note (optional)</label>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Any extra detail…"
              className="mt-0.5 w-full bg-transparent text-sm text-base-content outline-none placeholder:text-base-content/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex-1 rounded-xl border border-base-300 py-1.5 text-xs font-semibold text-base-content hover:bg-base-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !editTitle.trim() || !editTriggerAt}
              className="flex-1 rounded-xl bg-primary py-1.5 text-xs font-semibold text-primary-content transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className={`text-sm font-semibold text-base-content ${isDone ? "line-through" : ""}`}>
            {reminder.title}
          </p>
          {reminder.text && (
            <p className="text-xs text-base-content/60 line-clamp-2">{reminder.text}</p>
          )}
          <p className="mt-1 flex items-center gap-1 text-xs text-base-content/40">
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
              <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {formatDateTime(reminder.triggerAt)}
          </p>
        </div>
      )}

      {/* Footer: toggle done (hidden while editing) */}
      {!editing && (
        <button
          type="button"
          onClick={() => void handleToggleDone()}
          disabled={toggling}
          className={`flex items-center justify-center gap-1.5 border-t border-base-200 py-2 text-xs font-semibold transition-colors ${
            isDone
              ? "text-base-content/50 hover:bg-base-200"
              : "text-success hover:bg-success/5"
          }`}
        >
          {toggling ? (
            <span className="loading loading-spinner loading-xs" />
          ) : isDone ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Mark as pending
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mark as done
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function LeadRemindersTab({
  reminders,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
}: LeadRemindersTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [triggerAt, setTriggerAt] = useState("");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleAdd() {
    if (!title.trim() || !triggerAt) return;
    setAdding(true);
    setFormError(null);
    try {
      const payload: CreateLeadReminderPayload = {
        title: title.trim(),
        triggerAt: new Date(triggerAt).toISOString(),
        ...(text.trim() && { text: text.trim() }),
      };
      await onCreate(payload);
      setTitle("");
      setText("");
      setTriggerAt("");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create reminder");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-xs text-error">{error}</p>}

      {reminders.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-warning" aria-hidden="true">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-medium text-base-content/60">No reminders yet</p>
          <p className="mt-0.5 text-xs text-base-content/40">Tap below to set your first reminder</p>
        </div>
      )}

      {reminders.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {reminders.map((r) => (
            <ReminderItem key={r.id} reminder={r} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-base-200 bg-warning/5 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-warning" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs font-medium text-warning">New reminder</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            <div className="rounded-xl bg-base-200/60 px-3 py-2">
              <label htmlFor="reminder-title" className="text-xs font-medium text-base-content/50">Title *</label>
              <input
                id="reminder-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Follow up call"
                className="mt-0.5 w-full bg-transparent text-sm font-medium text-base-content outline-none placeholder:text-base-content/30"
                autoFocus
              />
            </div>
            <div className="rounded-xl bg-base-200/60 px-3 py-2">
              <label htmlFor="reminder-date" className="text-xs font-medium text-base-content/50">Date &amp; Time *</label>
              <input
                id="reminder-date"
                type="datetime-local"
                value={triggerAt}
                onChange={(e) => setTriggerAt(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-sm font-medium text-base-content outline-none"
              />
            </div>
            <div className="rounded-xl bg-base-200/60 px-3 py-2">
              <label htmlFor="reminder-text" className="text-xs font-medium text-base-content/50">Note (optional)</label>
              <input
                id="reminder-text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Any extra detail…"
                className="mt-0.5 w-full bg-transparent text-sm text-base-content outline-none placeholder:text-base-content/30"
              />
            </div>
            {formError && <p className="text-xs text-error">{formError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setTitle(""); setText(""); setTriggerAt(""); setFormError(null); setShowForm(false); }}
                disabled={adding}
                className="flex-1 rounded-xl border border-base-300 py-2 text-xs font-semibold text-base-content hover:bg-base-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={adding || !title.trim() || !triggerAt}
                className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-content transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {adding ? <span className="loading loading-spinner loading-xs" /> : "Add Reminder"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-base-300 py-4 text-sm font-medium text-base-content/50 hover:border-primary hover:text-primary transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add Reminder
        </button>
      )}
    </div>
  );
}
