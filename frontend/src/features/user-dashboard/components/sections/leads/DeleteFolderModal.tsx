import { useState } from "react";
import type { LeadFolder } from "@features/user-dashboard/types";

interface DeleteFolderModalProps {
  open: boolean;
  folder: LeadFolder | null;
  onDelete: (id: string, mode: "move" | "delete") => Promise<void>;
  onClose: () => void;
}

export default function DeleteFolderModal({
  open,
  folder,
  onDelete,
  onClose,
}: DeleteFolderModalProps) {
  const [deleting, setDeleting] = useState<"move" | "delete" | null>(null);

  async function handleDelete(mode: "move" | "delete") {
    if (!folder) return;
    setDeleting(mode);
    try {
      await onDelete(folder.id, mode);
      onClose();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open={open}>
      <div className="modal-box">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-error/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-error"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </span>
          <h3 className="text-lg font-bold text-base-content">Delete Folder</h3>
        </div>

        <p className="mb-6 text-sm text-base-content/70">
          Delete folder &ldquo;{folder?.name}&rdquo;? Choose how to handle its leads:
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-outline w-full"
            onClick={() => void handleDelete("move")}
            disabled={deleting !== null}
          >
            {deleting === "move" ? (
              <span className="loading loading-spinner loading-sm" />
            ) : null}
            Move leads to All
          </button>
          <button
            type="button"
            className="btn btn-error w-full"
            onClick={() => void handleDelete("delete")}
            disabled={deleting !== null}
          >
            {deleting === "delete" ? (
              <span className="loading loading-spinner loading-sm" />
            ) : null}
            Delete leads too
          </button>
        </div>

        <div className="modal-action mt-4">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={deleting !== null}
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
