import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import EmptyStepState from "@components/EmptyStepState";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { deleteEcard } from "@services/ecardService";
import {
  ROUTES,
  adminEcardBuilderPath,
  adminNewEcardPath,
} from "@config/routes";
import { useEcardList } from "@features/ecards/hooks/useEcardList";
import type { Customer } from "@app-types/customer";
import type { Ecard } from "@app-types/ecard";

export default function EcardListView() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { customer?: Customer } };
  const customer = location.state?.customer;

  const list = useEcardList(customerId ?? "");
  const deleteAction = useAsyncAction();
  const [deletingCard, setDeletingCard] = useState<Ecard | null>(null);

  if (!customerId) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-base-content/60">Missing customer.</p>
      </div>
    );
  }

  function handleDelete() {
    if (!deletingCard) return;
    void deleteAction.run(
      () => deleteEcard(deletingCard.id),
      () => {
        setDeletingCard(null);
        list.refetch();
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.adminEcards)}
          aria-label="Back to customers"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-base-content">
            {customer?.name ?? "Customer"}&rsquo;s E-cards
          </h1>
          <p className="text-sm text-base-content/60">
            {list.ecards.length} {list.ecards.length === 1 ? "e-card" : "e-cards"}
          </p>
        </div>
        <button
          type="button"
          aria-label="New e-card"
          onClick={() =>
            navigate(adminNewEcardPath(customerId), { state: { customer } })
          }
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {list.isLoading && <p className="text-sm text-base-content/50">Loading…</p>}
      {list.error && <p className="text-sm text-error">{list.error}</p>}

      {!list.isLoading && list.ecards.length === 0 && (
        <EmptyStepState
          icon={Sparkles}
          message="No e-cards yet for this customer. Tap + above to add one."
        />
      )}

      {list.ecards.length > 0 && (
        <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
          {list.ecards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-3 border-b border-base-300 px-4 py-3 last:border-b-0"
            >
              <button
                type="button"
                onClick={() =>
                  navigate(adminEcardBuilderPath(customerId, card.id), {
                    state: { customer },
                  })
                }
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-base-content">
                    {card.hero.name}
                  </p>
                  <p className="truncate text-xs text-base-content/50">
                    {card.hero.companyName || `/${card.endpoint}`}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAction.reset();
                  setDeletingCard(card);
                }}
                aria-label="Delete e-card"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionModal
        open={deletingCard !== null}
        icon={Trash2}
        title={`Delete ${deletingCard?.hero.name ?? "this e-card"}?`}
        description="This permanently removes the e-card and its media. This can't be undone."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeletingCard(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
