import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Pagination from "@components/Pagination";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { useSmartCardList } from "@features/smart-cards/hooks/useSmartCardList";
import { useSmartCardMutations } from "@features/smart-cards/hooks/useSmartCardMutations";
import { SMART_CARD_LIST_ITEM_REGISTRY } from "@features/smart-cards/config/templateComponents.config";
import { SMART_CARD_TEMPLATES } from "@features/smart-cards/config/smartCardTemplates.config";
import ConfirmActionModal from "@components/ConfirmActionModal";
import SmartCardFormModal from "@features/smart-cards/components/SmartCardFormModal";
import { ROUTES, smartCardPublicPath } from "@config/routes";
import type { SmartCard, SmartCardTemplateKey } from "@app-types/smartCard";

type FormModalState = { mode: "create" } | { mode: "edit"; card: SmartCard } | null;

export default function SmartCardListView() {
  const navigate = useNavigate();
  const { templateKey } = useParams<{ templateKey: SmartCardTemplateKey }>();
  const template = SMART_CARD_TEMPLATES.find((t) => t.key === templateKey);
  const list = useSmartCardList(templateKey as SmartCardTemplateKey);
  const mutations = useSmartCardMutations(
    templateKey as SmartCardTemplateKey,
    list.refetch,
  );
  const deleteAction = useAsyncAction();
  const [deletingCard, setDeletingCard] = useState<SmartCard | null>(null);
  const [formModal, setFormModal] = useState<FormModalState>(null);

  if (!templateKey || !template) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-base-content/60">Unknown template.</p>
      </div>
    );
  }

  const ListItem = SMART_CARD_LIST_ITEM_REGISTRY[templateKey];

  function handleDelete() {
    if (!deletingCard) return;
    void deleteAction.run(
      () => mutations.remove(deletingCard.id),
      () => setDeletingCard(null),
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.adminSmartCards)}
          aria-label="Back to templates"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-base-content">{template.name}</h1>
          <p className="text-sm text-base-content/60">
            {list.total} {list.total === 1 ? "smart card" : "smart cards"}
          </p>
        </div>
        <button
          type="button"
          aria-label="New smart card"
          onClick={() => setFormModal({ mode: "create" })}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {list.error && <p className="text-sm text-error">{list.error}</p>}

      {!list.isLoading && list.smartCards.length === 0 && (
        <p className="rounded-box border border-dashed border-base-300 px-4 py-10 text-center text-sm text-base-content/50">
          No smart cards yet. Tap + above to create your first one.
        </p>
      )}

      {list.smartCards.length > 0 && (
        <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
          {list.smartCards.map((card) => (
            <ListItem
              key={card.id}
              card={card}
              onPreview={() =>
                window.open(smartCardPublicPath(card.endpoint), "_blank")
              }
              onEdit={() => setFormModal({ mode: "edit", card })}
              onDelete={() => {
                deleteAction.reset();
                setDeletingCard(card);
              }}
            />
          ))}
        </div>
      )}

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
      />

      <SmartCardFormModal
        templateKey={templateKey}
        mode={formModal?.mode ?? "create"}
        card={formModal?.mode === "edit" ? formModal.card : undefined}
        open={formModal !== null}
        onClose={() => setFormModal(null)}
        onSuccess={() => {
          setFormModal(null);
          list.refetch();
        }}
      />

      <ConfirmActionModal
        open={deletingCard !== null}
        icon={Trash2}
        title={`Delete ${deletingCard?.profile?.companyName || deletingCard?.endpoint}?`}
        description="This permanently removes the smart card and its media. This can't be undone."
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
