import { useState } from "react";
import { ArrowLeft, Check, History, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import { useAsyncAction } from "@hooks/useAsyncAction";
import FieldListEditor from "@features/exchange-contact-forms/components/FieldListEditor";
import FormVersionHistoryPanel from "@features/exchange-contact-forms/components/FormVersionHistoryPanel";
import LinkedEcardsPicker from "@features/exchange-contact-forms/components/LinkedEcardsPicker";
import { useExchangeContactFormBuilder } from "@features/exchange-contact-forms/hooks/useExchangeContactFormBuilder";
import { EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH } from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
import type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";
import type { ExchangeContactForm } from "@app-types/exchangeContactForm";

export interface ExchangeContactFormBuilderViewProps {
  /** null when creating a brand-new form. */
  formId: string | null;
  /** Must be a stable (e.g. useMemo'd) reference — threaded down into the
   * builder hook and every child that calls it. */
  api: ExchangeContactFormApi;
  /** e.g. "Priyanka's Exchange Contact Form" or "My Exchange Contact Form". */
  heading: string;
  /** Omit to hide the back button (e.g. when embedded elsewhere). */
  onBack?: () => void;
  /** Called once, right after a brand-new form's first successful save, so
   * the caller can move the URL from a "new" placeholder to the real id. */
  onCreated?: (form: ExchangeContactForm) => void;
}

export default function ExchangeContactFormBuilderView({
  formId,
  api,
  heading,
  onBack,
  onCreated,
}: ExchangeContactFormBuilderViewProps) {
  const builder = useExchangeContactFormBuilder(formId, api);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [linkedEcardIds, setLinkedEcardIds] = useState<string[]>([]);
  const deleteAction = useAsyncAction();

  // Resyncs from the loaded form only when it's genuinely a *different* form
  // (by id), not on every save — a fields-only save returns a new form
  // object with the same id, and by then linkedEcardIds may already reflect
  // a separate, independently-saved change from the picker below that the
  // form's own (stale-at-load-time) linkedEcardIds snapshot doesn't know
  // about. Adjusting state during render (not in an effect) mirrors
  // useEcardBuilder's own resetForId pattern for the same "sync on id
  // change" need.
  const currentFormId = builder.existingForm?.id ?? null;
  const [syncedFormId, setSyncedFormId] = useState(currentFormId);
  if (currentFormId !== syncedFormId) {
    setSyncedFormId(currentFormId);
    setLinkedEcardIds(builder.existingForm?.linkedEcardIds ?? []);
  }

  const handleSaveAll = async () => {
    const saved = await builder.save();
    if (!saved) return;
    if (formId === null) {
      onCreated?.(saved);
      return;
    }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  };

  const handleDelete = () => {
    if (!builder.existingForm) return;
    void deleteAction.run(
      () => api.deleteForm(builder.existingForm!.id),
      () => {
        setIsConfirmingDelete(false);
        onBack?.();
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to forms"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-base-content">
            {heading}
          </h1>
          <p className="text-sm text-base-content/60">
            {builder.existingForm ? "Editing existing form" : "Creating a new form"}
          </p>
        </div>
        {builder.existingForm && (
          <>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              aria-label="Version history"
              title="Version history"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base-content/60 hover:bg-base-200 hover:text-primary"
            >
              <History className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              aria-label="Delete form"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {builder.isLoading && (
        <p className="text-sm text-base-content/50">Loading…</p>
      )}
      {builder.loadError && (
        <p className="text-sm text-error">{builder.loadError}</p>
      )}

      {!builder.isLoading && (
        <>
          <div>
            <label
              htmlFor="form-name"
              className="mb-1.5 block text-xs font-semibold text-base-content/70"
            >
              Form name (internal only — not shown to visitors)
            </label>
            <input
              id="form-name"
              value={builder.state.name}
              onChange={(event) => {
                const name = event.target.value;
                builder.setState((state) => ({ ...state, name }));
              }}
              maxLength={EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH}
              placeholder="e.g. Trade show 2026"
              className={`min-h-11 w-full rounded-field border bg-base-200 px-3 text-sm text-base-content transition focus:bg-base-100 focus:outline-none ${
                builder.nameError
                  ? "border-error focus:border-error"
                  : "border-base-300 focus:border-primary"
              }`}
            />
            {builder.nameError && (
              <p className="mt-1.5 text-xs text-error">{builder.nameError}</p>
            )}
          </div>

          {builder.existingForm && (
            <LinkedEcardsPicker
              api={api}
              formId={builder.existingForm.id}
              linkedEcardIds={linkedEcardIds}
              onSaved={setLinkedEcardIds}
            />
          )}

          <FieldListEditor
            fields={builder.state.fields}
            onChange={(fields) =>
              builder.setState((state) => ({ ...state, fields }))
            }
          />

          {builder.forkedAt && (
            <p className="rounded-field border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
              Saved as a new version — the previous version is preserved
              because it already has responses.
            </p>
          )}

          {builder.saveError && (
            <p className="text-sm text-error">{builder.saveError}</p>
          )}

          <button
            type="button"
            onClick={() => void handleSaveAll()}
            disabled={builder.isSaving}
            className="btn min-h-11 gap-2 rounded-field bg-primary px-6 text-primary-content hover:bg-primary/90"
          >
            {builder.isSaving && (
              <span className="loading loading-spinner loading-sm" />
            )}
            {savedAt && !builder.isSaving && <Check className="h-4 w-4" />}
            {savedAt && !builder.isSaving ? "Saved" : "Save form"}
          </button>
        </>
      )}

      {builder.existingForm && (
        <FormVersionHistoryPanel
          api={api}
          open={isHistoryOpen}
          formId={builder.existingForm.id}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      <ConfirmActionModal
        open={isConfirmingDelete}
        icon={Trash2}
        title="Delete this form?"
        description="This permanently removes the form and every version's field list. This can't be undone, and is only possible while no version has any submissions."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
