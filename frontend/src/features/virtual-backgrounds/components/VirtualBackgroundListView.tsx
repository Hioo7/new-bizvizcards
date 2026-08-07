import { useState } from "react";
import { ArrowLeft, Download, ImageIcon, Plus, Trash2 } from "lucide-react";
import ConfirmActionModal from "@components/ConfirmActionModal";
import EmptyStepState from "@components/EmptyStepState";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { useMyEffectivePolicy } from "@hooks/useMyEffectivePolicy";
import { deleteVirtualBackground } from "@services/virtualBackgroundService";
import type { VirtualBackgroundSummary } from "@app-types/virtualBackground";
import { useVirtualBackgroundList } from "@features/virtual-backgrounds/hooks/useVirtualBackgroundList";
import { useVirtualBackgroundTemplates } from "@features/virtual-backgrounds/hooks/useVirtualBackgroundTemplates";
import { useCustomerEcardsForVirtualBackground } from "@features/virtual-backgrounds/hooks/useCustomerEcardsForVirtualBackground";
import VirtualBackgroundCreateModal from "@features/virtual-backgrounds/components/VirtualBackgroundCreateModal";
import PlatformInstructions from "@features/virtual-backgrounds/components/PlatformInstructions";

interface VirtualBackgroundListViewProps {
  onBack?: () => void;
}

function handleDownload(virtualBackground: VirtualBackgroundSummary) {
  const link = document.createElement("a");
  link.href = virtualBackground.imageUrl;
  link.download = `virtual-background-${virtualBackground.id}.png`;
  link.click();
}

export default function VirtualBackgroundListView({
  onBack,
}: VirtualBackgroundListViewProps) {
  const list = useVirtualBackgroundList();
  const { policy } = useMyEffectivePolicy();
  const { templates } = useVirtualBackgroundTemplates();
  const { ecards } = useCustomerEcardsForVirtualBackground();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const deleteAction = useAsyncAction();
  const [deleteTarget, setDeleteTarget] =
    useState<VirtualBackgroundSummary | null>(null);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    void deleteAction.run(
      () => deleteVirtualBackground(deleteTarget.id),
      () => {
        setDeleteTarget(null);
        list.refetch();
      },
    );
  }

  const isAvailable = policy?.virtualBackground.isAvailable ?? false;
  const maxVirtualBackgrounds = policy?.virtualBackground.maxVirtualBackgrounds ?? 0;
  const allowCustomBackground = policy?.virtualBackground.allowCustomBackground ?? false;
  const atLimit = list.virtualBackgrounds.length >= maxVirtualBackgrounds;
  const canCreate = isAvailable && !atLimit;

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
            Virtual Backgrounds
          </h1>
          <p className="text-sm text-base-content/60">
            {list.virtualBackgrounds.length}
            {maxVirtualBackgrounds > 0 ? ` / ${maxVirtualBackgrounds}` : ""}{" "}
            {list.virtualBackgrounds.length === 1 ? "background" : "backgrounds"}
          </p>
        </div>
        <button
          type="button"
          aria-label="New virtual background"
          title={
            !isAvailable
              ? "Not available on your plan"
              : atLimit
                ? "You've reached your plan's limit"
                : "New virtual background"
          }
          disabled={!canCreate}
          onClick={() => setIsCreateOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {!isAvailable && (
        <p className="rounded-field border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content/60">
          Virtual backgrounds aren't included in your current plan.
        </p>
      )}

      {list.isLoading && <p className="text-sm text-base-content/50">Loading…</p>}
      {list.error && <p className="text-sm text-error">{list.error}</p>}

      {!list.isLoading && list.virtualBackgrounds.length === 0 && (
        <EmptyStepState
          icon={ImageIcon}
          message="No virtual backgrounds yet. Tap + above to create one."
        />
      )}

      {list.virtualBackgrounds.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.virtualBackgrounds.map((virtualBackground) => (
            <div
              key={virtualBackground.id}
              className="relative flex flex-col overflow-hidden rounded-field border border-base-300"
            >
              <img
                src={virtualBackground.imageUrl}
                alt="Virtual background"
                className="aspect-video w-full object-cover"
              />
              <div className="absolute right-1.5 top-1.5 flex gap-1.5">
                <button
                  type="button"
                  aria-label="Download"
                  onClick={() => handleDownload(virtualBackground)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-base-100/90 text-base-content hover:bg-base-100"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={() => {
                    deleteAction.reset();
                    setDeleteTarget(virtualBackground);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-error/90 text-error-content hover:bg-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlatformInstructions />

      <VirtualBackgroundCreateModal
        open={isCreateOpen}
        ecards={ecards}
        templates={templates}
        allowCustomBackground={allowCustomBackground}
        onCancel={() => setIsCreateOpen(false)}
        onSaved={() => {
          setIsCreateOpen(false);
          list.refetch();
        }}
      />

      <ConfirmActionModal
        open={deleteTarget !== null}
        icon={Trash2}
        title="Delete virtual background"
        description="This permanently removes this virtual background. This can't be undone."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
