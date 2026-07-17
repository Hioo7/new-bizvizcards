import { useState } from "react";
import type {
  LeadReferenceNote,
  CreateLeadReferenceNotePayload,
  UpdateLeadReferenceNotePayload,
} from "@features/user-dashboard/types";

interface LeadNotesTabProps {
  notes: LeadReferenceNote[];
  loading: boolean;
  error: string | null;
  onCreate: (payload: CreateLeadReferenceNotePayload) => Promise<void>;
  onUpdate: (
    noteId: string,
    payload: UpdateLeadReferenceNotePayload,
  ) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NoteItem({
  note,
  onUpdate,
  onDelete,
}: {
  note: LeadReferenceNote;
  onUpdate: (noteId: string, payload: UpdateLeadReferenceNotePayload) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await onUpdate(note.id, { content: editContent.trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(note.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 border-b border-base-200 bg-primary/5 px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-primary" aria-hidden="true">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="9" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <span className="flex-1 text-xs text-base-content/40">{formatDate(note.updatedAt)}</span>
        {!editing && (
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => { setEditContent(note.content); setEditing(true); }}
              aria-label="Edit note"
              className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-primary/10 text-base-content/40 hover:text-primary transition-colors"
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
              aria-label="Delete note"
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
      <div className="p-3">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl bg-base-200/60 px-3 py-2 text-sm text-base-content outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setEditContent(note.content); setEditing(false); }}
                disabled={saving}
                className="flex-1 rounded-xl border border-base-300 py-1.5 text-xs font-semibold text-base-content hover:bg-base-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !editContent.trim()}
                className="flex-1 rounded-xl bg-primary py-1.5 text-xs font-semibold text-primary-content transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-base-content leading-relaxed line-clamp-4 whitespace-pre-wrap break-words">
            {note.content}
          </p>
        )}
      </div>
    </div>
  );
}

export default function LeadNotesTab({
  notes,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
}: LeadNotesTabProps) {
  const [newContent, setNewContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleAdd() {
    if (!newContent.trim()) return;
    setAdding(true);
    try {
      await onCreate({ content: newContent.trim() });
      setNewContent("");
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-xs text-error">{error}</p>}

      {notes.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-primary" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-medium text-base-content/60">No notes yet</p>
          <p className="mt-0.5 text-xs text-base-content/40">Tap below to add your first note</p>
        </div>
      )}

      {/* Notes grid */}
      {notes.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}

      {/* Add form / trigger */}
      {showForm ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-base-200 bg-primary/5 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-primary" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs font-medium text-primary">New note</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write a note…"
              rows={3}
              className="w-full resize-none rounded-xl bg-base-200/60 px-3 py-2 text-sm text-base-content outline-none placeholder:text-base-content/30"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setNewContent(""); setShowForm(false); }}
                disabled={adding}
                className="flex-1 rounded-xl border border-base-300 py-2 text-xs font-semibold text-base-content hover:bg-base-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={adding || !newContent.trim()}
                className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-content transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {adding ? <span className="loading loading-spinner loading-xs" /> : "Add Note"}
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
          Add Note
        </button>
      )}
    </div>
  );
}
