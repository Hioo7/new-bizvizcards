import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, Pencil, Plus, Sparkles } from "lucide-react";
import EmptyStepState from "@components/EmptyStepState";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import { useEcardList } from "@hooks/useEcardList";
import { adminEcardBuilderPath, adminNewEcardPath } from "@config/routes";
import type { OrganisationMemberSummary } from "@app-types/ecard";
import { memberToCustomerShim } from "@features/customer-organisation-management/utils/memberToCustomerShim";

interface LinkMemberEcardModalProps {
  open: boolean;
  member: OrganisationMemberSummary | null;
  organisationId: string;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onLink: (ecardId: string) => void;
}

export default function LinkMemberEcardModal({
  open,
  member,
  organisationId,
  isSubmitting,
  error,
  onCancel,
  onLink,
}: LinkMemberEcardModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const list = useEcardList(member?.customerId ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // The close path must not depend on `member` — the parent clears it to
    // null in the same state update that flips `open` to false, so gating
    // the whole effect on `member` would strand the dialog open forever.
    if (open && member && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, member]);

  const customerState = member ? { customer: memberToCustomerShim(member) } : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box flex max-h-[85vh] flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <h3 className="min-w-0 truncate text-lg font-bold text-base-content">
            Link e-card{member ? ` for ${member.name}` : ""}
          </h3>
        </div>

        {member && (
          <button
            type="button"
            onClick={() =>
              navigate(adminNewEcardPath(member.customerId), {
                state: customerState,
              })
            }
            className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-field border border-dashed border-primary/40 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" />
            Create a new e-card
          </button>
        )}

        <div className="mt-3 max-h-72 overflow-y-auto rounded-field border border-base-300">
          {list.isLoading && (
            <p className="px-3 py-3 text-sm text-base-content/50">Loading…</p>
          )}
          {!list.isLoading && list.error && (
            <FormErrorRibbon message={list.error} />
          )}
          {!list.isLoading && !list.error && list.ecards.length === 0 && (
            <EmptyStepState
              icon={Sparkles}
              message="This customer has no e-cards yet. Create one above."
            />
          )}
          {!list.isLoading &&
            !list.error &&
            list.ecards.map((card) => {
              const isCurrentlyLinked = card.organisationId === organisationId;
              return (
                <div
                  key={card.id}
                  className={`flex items-center gap-3 border-b border-base-300 px-3 py-2.5 last:border-b-0 ${
                    isCurrentlyLinked ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-200">
                    {card.hero.profilePhotoUrl ? (
                      <img
                        src={card.hero.profilePhotoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Sparkles className="h-4 w-4 text-base-content/30" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-base-content">
                      {card.hero.name}
                    </p>
                    <p className="truncate text-xs text-base-content/50">
                      /{card.endpoint}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Edit ${card.hero.name}`}
                    onClick={() =>
                      navigate(adminEcardBuilderPath(card.customerId, card.id), {
                        state: customerState,
                      })
                    }
                    className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {isCurrentlyLinked ? (
                    <span className="shrink-0 text-xs font-semibold text-primary">
                      Linked
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onLink(card.id)}
                      className="btn btn-sm min-h-9 shrink-0 gap-1.5 rounded-field bg-primary text-xs text-primary-content hover:bg-primary/90"
                    >
                      {isSubmitting && (
                        <span className="loading loading-spinner loading-xs" />
                      )}
                      Link
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="modal-action">
          <button
            type="button"
            onClick={onCancel}
            className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
