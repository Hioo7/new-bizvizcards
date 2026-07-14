import { useState } from "react";
import type { LeadFolder } from "@features/user-dashboard/types";

interface RenameFolderModalProps {
  open: boolean;
  folder: LeadFolder | null;
  onSave: (id: string, name: string) => Promise<void>;
  onClose: () => void;
}

export default function RenameFolderModal({
  open,
  folder,
  onSave,
  onClose,
}: RenameFolderModalProps) {
  const [name, setName] = useState(folder?.name ?? "");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Folder name is required");
      return;
    }
    if (!folder) return;
    setSaving(true);
    try {
      await onSave(folder.id, name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open={open}>
      <div className="modal-box">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
          <h3 className="text-lg font-bold text-base-content">Rename Folder</h3>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <div className="form-control">
            <label className="label" htmlFor="rename-folder-name">
              <span className="label-text font-medium">
                Folder name <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="rename-folder-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className={`input input-bordered w-full ${nameError ? "input-error" : ""}`}
              placeholder="Folder name"
              autoFocus
            />
            {nameError && (
              <label className="label">
                <span className="label-text-alt text-error">{nameError}</span>
              </label>
            )}
          </div>

          <div className="modal-action mt-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
