import { useState } from "react";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import { FieldListEditor } from "@features/exchange-contact-forms";
import { EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH } from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
import { useOrganisationExchangeContactFormTemplateBuilder } from "@features/organisation-exchange-contact-form-template/hooks/useOrganisationExchangeContactFormTemplateBuilder";
import type { OrganisationExchangeContactFormTemplateBuilderApi } from "@features/organisation-exchange-contact-form-template/types/organisationExchangeContactFormTemplateBuilder.types";

export interface OrganisationExchangeContactFormTemplateBuilderViewProps {
  organisationId: string;
  /** Must be a stable (e.g. useMemo'd) reference. */
  api: OrganisationExchangeContactFormTemplateBuilderApi;
  /** Omit to hide the back button (e.g. when embedded as a dashboard tab). */
  onBack?: () => void;
}

export default function OrganisationExchangeContactFormTemplateBuilderView({
  organisationId,
  api,
  onBack,
}: OrganisationExchangeContactFormTemplateBuilderViewProps) {
  const builder = useOrganisationExchangeContactFormTemplateBuilder(
    organisationId,
    api,
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  async function handleSaveAll() {
    const saved = await builder.save();
    if (!saved) return;
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  }

  async function handleConfirmRemove() {
    const removed = await builder.remove();
    if (removed) {
      setIsConfirmingRemove(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to organisation"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-base-content">
            Exchange Contact Form Template
          </h1>
          <p className="text-sm text-base-content/60">
            Overrides every linked member e-card&rsquo;s own form
          </p>
        </div>
        {builder.templateExists && (
          <button
            type="button"
            onClick={() => setIsConfirmingRemove(true)}
            aria-label="Remove form template"
            title="Remove form template"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-error/70 hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-5 w-5" />
          </button>
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
              htmlFor="template-name"
              className="mb-1.5 block text-xs font-semibold text-base-content/70"
            >
              Template name (internal only — not shown to visitors)
            </label>
            <input
              id="template-name"
              value={builder.state.name}
              onChange={(event) => {
                const name = event.target.value;
                builder.setState((state) => ({ ...state, name }));
              }}
              maxLength={EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH}
              placeholder="e.g. Acme Corp standard form"
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
            {savedAt && !builder.isSaving ? "Saved" : "Save template"}
          </button>
        </>
      )}

      <ConfirmActionModal
        open={isConfirmingRemove}
        icon={Trash2}
        title="Remove this form template?"
        description="Every linked member e-card reverts to its own linked form (or the legacy form). This can't be undone, and is only possible while no version has any submissions."
        confirmLabel="Remove"
        isDestructive
        isSubmitting={builder.isDeleting}
        error={builder.deleteError}
        onCancel={() => setIsConfirmingRemove(false)}
        onConfirm={() => void handleConfirmRemove()}
      />
    </div>
  );
}
