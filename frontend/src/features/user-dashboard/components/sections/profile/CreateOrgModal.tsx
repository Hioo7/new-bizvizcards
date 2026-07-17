import { useState } from "react";

interface CreateOrgModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export default function CreateOrgModal({
  open,
  onClose,
  onSubmit,
}: CreateOrgModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(name.trim());
      setName("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organisation",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open>
      <div className="modal-box p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-base-300 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
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
          <h3 className="text-lg font-bold text-base-content">
            Create Organisation
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full hover:bg-base-200 text-base-content/50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-base-300 bg-base-200/50 px-4 py-3">
            <label
              htmlFor="create-org-name"
              className="text-xs font-medium text-base-content/50"
            >
              Organisation name
            </label>
            <input
              id="create-org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-medium text-base-content outline-none placeholder:text-base-content/30"
              placeholder="My Company"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full min-h-[52px] rounded-2xl bg-primary text-sm font-bold text-primary-content transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-60"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-xs" />
                Creating…
              </span>
            ) : (
              "Create Organisation"
            )}
          </button>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
