import { useState } from "react";
import { ArrowLeft, Mail, Plus, SquarePen, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import EmptyStepState from "@components/EmptyStepState";
import { useAsyncAction } from "@hooks/useAsyncAction";
import type { EmailSignature } from "@app-types/emailSignature";
import { EMAIL_SIGNATURE_TEMPLATE_OPTIONS } from "@features/email-signatures/config/emailSignatureBuilder.config";
import EmailSignatureBuilderModal from "@features/email-signatures/components/EmailSignatureBuilderModal";
import { useEmailSignatureList } from "@features/email-signatures/hooks/useEmailSignatureList";
import { deleteMyEmailSignature } from "@services/emailSignatureService";

interface EmailSignatureListViewProps {
  onBack?: () => void;
}

function templateLabel(key: EmailSignature["templateKey"]): string {
  return (
    EMAIL_SIGNATURE_TEMPLATE_OPTIONS.find((option) => option.key === key)
      ?.label ?? key
  );
}

export default function EmailSignatureListView({
  onBack,
}: EmailSignatureListViewProps) {
  const list = useEmailSignatureList();
  const deleteAction = useAsyncAction();
  const [deletingSignature, setDeletingSignature] =
    useState<EmailSignature | null>(null);
  const [builderState, setBuilderState] = useState<
    { mode: "create" } | { mode: "edit"; signature: EmailSignature } | null
  >(null);

  function handleDelete() {
    if (!deletingSignature) return;
    void deleteAction.run(
      () => deleteMyEmailSignature(deletingSignature.id),
      () => {
        setDeletingSignature(null);
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
            Email Signatures
          </h1>
          <p className="text-sm text-base-content/60">
            {list.signatures.length}{" "}
            {list.signatures.length === 1 ? "signature" : "signatures"}
          </p>
        </div>
        <button
          type="button"
          aria-label="New signature"
          onClick={() => setBuilderState({ mode: "create" })}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {list.isLoading && (
        <p className="text-sm text-base-content/50">Loading…</p>
      )}
      {list.error && <p className="text-sm text-error">{list.error}</p>}

      {!list.isLoading && list.signatures.length === 0 && (
        <EmptyStepState
          icon={Mail}
          message="No email signatures yet. Tap + above to create one."
        />
      )}

      {list.signatures.length > 0 && (
        <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
          {list.signatures.map((signature) => (
            <div
              key={signature.id}
              className="flex items-center gap-3 border-b border-base-300 px-4 py-3 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => setBuilderState({ mode: "edit", signature })}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  {signature.profileImageUrl ? (
                    <img
                      src={signature.profileImageUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-base-content">
                    {signature.name}
                  </p>
                  <p className="truncate text-xs text-base-content/50">
                    {signature.fullName} • {templateLabel(signature.templateKey)}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBuilderState({ mode: "edit", signature })}
                aria-label="Edit signature"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base-content/60 hover:bg-base-200"
              >
                <SquarePen className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAction.reset();
                  setDeletingSignature(signature);
                }}
                aria-label="Delete signature"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <EmailSignatureBuilderModal
        mode={builderState?.mode ?? "create"}
        signature={builderState?.mode === "edit" ? builderState.signature : undefined}
        open={builderState !== null}
        onCancel={() => setBuilderState(null)}
        onSaved={() => {
          setBuilderState(null);
          list.refetch();
        }}
      />

      <ConfirmActionModal
        open={deletingSignature !== null}
        icon={Trash2}
        title={`Delete ${deletingSignature?.name ?? "this signature"}?`}
        description="This permanently removes the signature. This can't be undone."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeletingSignature(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
