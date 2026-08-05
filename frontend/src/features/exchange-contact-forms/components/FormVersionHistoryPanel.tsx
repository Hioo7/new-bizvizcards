import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { History, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import { useAsyncAction } from "@hooks/useAsyncAction";
import type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";
import type { ExchangeContactFormVersionSummary } from "@app-types/exchangeContactForm";

interface FormVersionHistoryPanelProps {
  api: Pick<ExchangeContactFormApi, "listVersions" | "deleteVersion">;
  open: boolean;
  formId: string;
  onClose: () => void;
}

export default function FormVersionHistoryPanel({
  api,
  open,
  formId,
  onClose,
}: FormVersionHistoryPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [versions, setVersions] = useState<ExchangeContactFormVersionSummary[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(
    null,
  );
  const deleteAction = useAsyncAction();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await api.listVersions(formId);
        if (cancelled) return;
        setVersions(result);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load version history.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, formId, reloadToken, api]);

  function handleDelete() {
    if (!deletingVersionId) return;
    void deleteAction.run(
      () => api.deleteVersion(formId, deletingVersionId),
      () => {
        setDeletingVersionId(null);
        setReloadToken((token) => token + 1);
      },
    );
  }

  return (
    <>
      {createPortal(
        <dialog
          ref={dialogRef}
          className="modal modal-bottom sm:modal-middle"
          onClose={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <div className="modal-box flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-md">
            <div className="flex shrink-0 items-center gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-base-content">
                Version history
              </h3>
            </div>

            <div className="max-h-[60vh] flex-1 overflow-y-auto p-3 sm:p-4">
              {isLoading && (
                <p className="px-1 py-3 text-sm text-base-content/50">
                  Loading…
                </p>
              )}
              {loadError && (
                <p className="px-1 py-3 text-sm text-error">{loadError}</p>
              )}

              {!isLoading && !loadError && (
                <div className="flex flex-col gap-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center gap-3 rounded-field border border-base-300 bg-base-100 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-base-content">
                          Version {version.versionNumber}
                          {version.isCurrent && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-base-content/50">
                          {version.submissionCount}{" "}
                          {version.submissionCount === 1
                            ? "submission"
                            : "submissions"}{" "}
                          • {new Date(version.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          deleteAction.reset();
                          setDeletingVersionId(version.id);
                        }}
                        disabled={version.isCurrent || version.submissionCount > 0}
                        aria-label={`Delete version ${version.versionNumber}`}
                        title={
                          version.isCurrent
                            ? "Can't delete the current version"
                            : version.submissionCount > 0
                              ? "Can't delete a version with submissions"
                              : "Delete this version"
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-error/70 hover:bg-error/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-action m-0 shrink-0 border-t border-base-300 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
              >
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="submit">close</button>
          </form>
        </dialog>,
        document.body,
      )}

      <ConfirmActionModal
        open={deletingVersionId !== null}
        icon={Trash2}
        title="Delete this version?"
        description="This permanently removes this version and its saved field list. This can't be undone."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeletingVersionId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
