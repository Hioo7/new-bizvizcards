import { useState } from "react";
import { ArrowLeft, ClipboardList, Plus, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import EmptyStepState from "@components/EmptyStepState";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { useExchangeContactFormList } from "@features/exchange-contact-forms/hooks/useExchangeContactFormList";
import type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";
import type { ExchangeContactForm } from "@app-types/exchangeContactForm";

export interface ExchangeContactFormListViewProps {
  /** Must be a stable (e.g. useMemo'd) reference. */
  api: ExchangeContactFormApi;
  /** e.g. "Priyanka's Exchange Contact Forms" or "My Exchange Contact Forms". */
  heading: string;
  emptyStateMessage: string;
  /** Omit to hide the back button (e.g. when embedded elsewhere). */
  onBack?: () => void;
  onSelectForm: (form: ExchangeContactForm) => void;
  onNewForm: () => void;
}

export default function ExchangeContactFormListView({
  api,
  heading,
  emptyStateMessage,
  onBack,
  onSelectForm,
  onNewForm,
}: ExchangeContactFormListViewProps) {
  const list = useExchangeContactFormList(api);
  const deleteAction = useAsyncAction();
  const [deletingForm, setDeletingForm] = useState<ExchangeContactForm | null>(
    null,
  );

  function handleDelete() {
    if (!deletingForm) return;
    void deleteAction.run(
      () => api.deleteForm(deletingForm.id),
      () => {
        setDeletingForm(null);
        list.refetch();
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
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
            {list.forms.length} {list.forms.length === 1 ? "form" : "forms"}
          </p>
        </div>
        <button
          type="button"
          aria-label="New form"
          onClick={onNewForm}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {list.isLoading && <p className="text-sm text-base-content/50">Loading…</p>}
      {list.error && <p className="text-sm text-error">{list.error}</p>}

      {!list.isLoading && list.forms.length === 0 && (
        <EmptyStepState icon={ClipboardList} message={emptyStateMessage} />
      )}

      {list.forms.length > 0 && (
        <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
          {list.forms.map((form) => (
            <div
              key={form.id}
              className="flex items-center gap-3 border-b border-base-300 px-4 py-3 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onSelectForm(form)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-base-content">
                    {form.name}
                  </p>
                  <p className="truncate text-xs text-base-content/50">
                    {form.currentVersion.fields.length}{" "}
                    {form.currentVersion.fields.length === 1 ? "field" : "fields"} •{" "}
                    {form.linkedEcardIds.length}{" "}
                    {form.linkedEcardIds.length === 1 ? "e-card" : "e-cards"} linked
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAction.reset();
                  setDeletingForm(form);
                }}
                aria-label="Delete form"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionModal
        open={deletingForm !== null}
        icon={Trash2}
        title={`Delete ${deletingForm?.name ?? "this form"}?`}
        description="This permanently removes the form and every version's field list. This can't be undone, and is only possible while no version has any submissions."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeletingForm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
