import { useState } from "react";

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export default function CreateFolderModal({
  open,
  onClose,
  onSubmit,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setName("");
    setNameError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Folder name is required");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName("");
      setNameError("");
      onClose();
    } finally {
      setSubmitting(false);
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
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </span>
          <h3 className="text-lg font-bold text-base-content">New Folder</h3>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <div className="form-control">
            <label className="label" htmlFor="folder-name">
              <span className="label-text font-medium">
                Folder name <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className={`input input-bordered w-full ${nameError ? "input-error" : ""}`}
              placeholder="e.g. VIP Clients"
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
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </dialog>
  );
}
