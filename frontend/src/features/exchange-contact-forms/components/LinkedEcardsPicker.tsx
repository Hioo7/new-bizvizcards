import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, IdCard, Link2 } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";
import type { Ecard } from "@app-types/ecard";

interface LinkedEcardsPickerProps {
  api: Pick<ExchangeContactFormApi, "setLinkedEcards" | "listLinkableEcards">;
  formId: string;
  linkedEcardIds: string[];
  onSaved: (ecardIds: string[]) => void;
}

export default function LinkedEcardsPicker({
  api,
  formId,
  linkedEcardIds,
  onSaved,
}: LinkedEcardsPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(linkedEcardIds);
  const [ecards, setEcards] = useState<Ecard[]>([]);
  const [isLoadingEcards, setIsLoadingEcards] = useState(false);
  const [loadEcardsError, setLoadEcardsError] = useState<string | null>(null);
  const saveAction = useAsyncAction();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function open() {
    setSelectedIds(linkedEcardIds);
    saveAction.reset();
    setIsOpen(true);
    setIsLoadingEcards(true);
    setLoadEcardsError(null);
    api
      .listLinkableEcards()
      .then(setEcards)
      .catch((err: unknown) =>
        setLoadEcardsError(
          err instanceof Error ? err.message : "Failed to load e-cards.",
        ),
      )
      .finally(() => setIsLoadingEcards(false));
  }

  function toggle(ecardId: string) {
    setSelectedIds((current) =>
      current.includes(ecardId)
        ? current.filter((id) => id !== ecardId)
        : [...current, ecardId],
    );
  }

  function handleSave() {
    void saveAction.run(
      () => api.setLinkedEcards(formId, selectedIds),
      () => {
        onSaved(selectedIds);
        setIsOpen(false);
      },
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-base-content/70">
        Linked e-cards
      </p>
      <button
        type="button"
        onClick={open}
        className="flex min-h-11 w-full items-center gap-3 rounded-field border border-base-300 bg-base-200 px-3 py-2.5 text-left hover:bg-base-300/40"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-100 text-base-content/50">
          <Link2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-base-content">
            {linkedEcardIds.length === 0
              ? "Not linked to any e-card"
              : `${linkedEcardIds.length} e-card${linkedEcardIds.length === 1 ? "" : "s"} linked`}
          </p>
          <p className="truncate text-xs text-base-content/50">
            Choose which e-cards render this form
          </p>
        </div>
      </button>

      {createPortal(
        <dialog
          ref={dialogRef}
          className="modal modal-bottom sm:modal-middle"
          onClose={(event) => {
            event.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div className="modal-box flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-md">
            <div className="flex shrink-0 items-center gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-base-content">
                Link e-cards
              </h3>
            </div>

            <div className="max-h-[60vh] flex-1 overflow-y-auto p-2 sm:p-3">
              {isLoadingEcards && (
                <p className="px-3 py-3 text-sm text-base-content/50">
                  Loading…
                </p>
              )}
              {loadEcardsError && (
                <p className="px-3 py-3 text-sm text-error">
                  {loadEcardsError}
                </p>
              )}

              {!isLoadingEcards && !loadEcardsError && ecards.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-base-content/50">
                  No e-cards to link yet.
                </p>
              )}

              {!isLoadingEcards &&
                !loadEcardsError &&
                ecards.map((ecard) => {
                  const isSelected = selectedIds.includes(ecard.id);
                  return (
                    <button
                      key={ecard.id}
                      type="button"
                      onClick={() => toggle(ecard.id)}
                      className="flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left hover:bg-base-200"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-200">
                        {ecard.hero.profilePhotoUrl ? (
                          <img
                            src={ecard.hero.profilePhotoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <IdCard className="h-4 w-4 text-base-content/30" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-base-content">
                          {ecard.hero.name}
                        </p>
                        <p className="truncate text-xs text-base-content/50">
                          {ecard.hero.companyName || `/${ecard.endpoint}`}
                        </p>
                      </div>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-primary bg-primary text-primary-content"
                            : "border-base-300 bg-base-100"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="shrink-0 border-t border-base-300 px-4 py-3 sm:px-6">
              {saveAction.error && (
                <p className="mb-2 text-sm text-error">{saveAction.error}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={saveAction.isSubmitting}
                  className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveAction.isSubmitting}
                  className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
                >
                  {saveAction.isSubmitting && (
                    <span className="loading loading-spinner loading-sm" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="submit">close</button>
          </form>
        </dialog>,
        document.body,
      )}
    </div>
  );
}
