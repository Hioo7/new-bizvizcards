import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { isAdminTier } from "@utils/isAdminTier";
import Pagination from "@components/Pagination";
import ConfirmActionModal from "@components/ConfirmActionModal";
import { getPlan } from "@services/planService";
import type { CreatePlanPayload, PlanDetail, PlanSummary } from "@app-types/plan";
import { usePlanManagementList } from "@features/plans/hooks/usePlanManagementList";
import { usePlanManagementMutations } from "@features/plans/hooks/usePlanManagementMutations";
import PlanToolbar from "@features/plans/components/PlanToolbar";
import PlanTable from "@features/plans/components/PlanTable";
import PlanFormModal from "@features/plans/components/PlanFormModal";

export default function PlansApp() {
  const { staffUser } = useStaffAuth();

  const list = usePlanManagementList();
  const mutations = usePlanManagementMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createAction = useAsyncAction();

  const [editingPlan, setEditingPlan] = useState<PlanDetail | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const editAction = useAsyncAction();
  const loadEditAction = useAsyncAction();

  const [fallbackTarget, setFallbackTarget] = useState<PlanSummary | null>(null);
  const fallbackAction = useAsyncAction();

  const [deleteTarget, setDeleteTarget] = useState<PlanSummary | null>(null);
  const deleteAction = useAsyncAction();

  function handleCreateSubmit(draft: CreatePlanPayload) {
    void createAction.run(
      async () => {
        await mutations.createPlan(draft);
      },
      () => setIsCreateOpen(false),
    );
  }

  function handleEditOpen(plan: PlanSummary) {
    void loadEditAction.run(
      async () => {
        const detail = await getPlan(plan.id);
        setEditingPlan(detail);
      },
      () => setIsEditOpen(true),
    );
  }

  function handleEditSubmit(draft: CreatePlanPayload) {
    if (!editingPlan) return;
    void editAction.run(
      async () => {
        await mutations.updatePlan(editingPlan.id, draft);
      },
      () => setIsEditOpen(false),
    );
  }

  function handleSetFallbackConfirm() {
    if (!fallbackTarget) return;
    void fallbackAction.run(
      async () => {
        await mutations.setFallbackPlan(fallbackTarget.id);
      },
      () => setFallbackTarget(null),
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    void deleteAction.run(
      () => mutations.deletePlan(deleteTarget.id),
      () => setDeleteTarget(null),
    );
  }

  if (!staffUser) return null;
  const canDelete = isAdminTier(staffUser.role);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">Plans</h1>
        <p className="text-sm text-base-content/60">
          {list.total} {list.total === 1 ? "plan" : "plans"}
        </p>
      </div>

      <PlanToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        onAddPlan={() => {
          createAction.reset();
          setIsCreateOpen(true);
        }}
      />

      {loadEditAction.error && (
        <p className="text-sm text-error">{loadEditAction.error}</p>
      )}

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        <PlanTable
          plans={list.plans}
          isLoading={list.isLoading}
          error={list.error}
          hasActiveFilters={Boolean(list.search)}
          canDelete={canDelete}
          onEdit={handleEditOpen}
          onSetFallback={(plan) => {
            fallbackAction.reset();
            setFallbackTarget(plan);
          }}
          onDelete={(plan) => {
            deleteAction.reset();
            setDeleteTarget(plan);
          }}
        />
      </div>

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
      />

      <PlanFormModal
        mode="create"
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <PlanFormModal
        mode="edit"
        plan={editingPlan ?? undefined}
        open={isEditOpen}
        isSubmitting={editAction.isSubmitting}
        error={editAction.error}
        onCancel={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmActionModal
        open={fallbackTarget !== null}
        icon={Star}
        title="Set as fallback plan"
        description={`"${fallbackTarget?.name}" will become the system-wide fallback plan, applied to every customer with no active plan. This unsets the current fallback plan.`}
        confirmLabel="Set as fallback"
        isSubmitting={fallbackAction.isSubmitting}
        error={fallbackAction.error}
        onCancel={() => setFallbackTarget(null)}
        onConfirm={handleSetFallbackConfirm}
      />

      <ConfirmActionModal
        open={deleteTarget !== null}
        icon={Trash2}
        title="Delete plan"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone. Plans still in use by a customer cannot be deleted.`}
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
