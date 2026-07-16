import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { isAdminTier } from "@utils/isAdminTier";
import Pagination from "@components/Pagination";
import ConfirmActionModal from "@components/ConfirmActionModal";
import { adminEventDetailPath } from "@config/routes";
import type {
  CreateEventAsEmployeePayload,
  EventSummary,
  UpdateEventPayload,
} from "@app-types/businessEvent";
import { useEventManagementList } from "@features/business-events/hooks/useEventManagementList";
import { useEventManagementMutations } from "@features/business-events/hooks/useEventManagementMutations";
import EventToolbar from "@features/business-events/components/EventToolbar";
import EventTable from "@features/business-events/components/EventTable";
import EventFormModal from "@features/business-events/components/EventFormModal";

export default function BusinessEventsApp() {
  const { staffUser } = useStaffAuth();
  const navigate = useNavigate();

  const list = useEventManagementList();
  const mutations = useEventManagementMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createAction = useAsyncAction();

  const [editingEvent, setEditingEvent] = useState<EventSummary | null>(null);
  const editAction = useAsyncAction();

  const [deleteTarget, setDeleteTarget] = useState<EventSummary | null>(null);
  const deleteAction = useAsyncAction();

  function handleCreateSubmit(draft: CreateEventAsEmployeePayload) {
    void createAction.run(
      async () => {
        await mutations.createEvent(draft);
      },
      () => setIsCreateOpen(false),
    );
  }

  function handleEditSubmit(draft: UpdateEventPayload) {
    if (!editingEvent) return;
    void editAction.run(
      async () => {
        await mutations.updateEvent(editingEvent.id, draft);
      },
      () => setEditingEvent(null),
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    void deleteAction.run(
      () => mutations.deleteEvent(deleteTarget.id),
      () => setDeleteTarget(null),
    );
  }

  if (!staffUser) return null;
  const canDelete = isAdminTier(staffUser.role);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">
          Business Events
        </h1>
        <p className="text-sm text-base-content/60">
          {list.total} {list.total === 1 ? "event" : "events"}
        </p>
      </div>

      <EventToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        onAddEvent={() => {
          createAction.reset();
          setIsCreateOpen(true);
        }}
      />

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        <EventTable
          events={list.events}
          isLoading={list.isLoading}
          error={list.error}
          hasActiveFilters={Boolean(list.search)}
          canDelete={canDelete}
          onManage={(event) => navigate(adminEventDetailPath(event.id))}
          onEdit={(event) => {
            editAction.reset();
            setEditingEvent(event);
          }}
          onDelete={(event) => {
            deleteAction.reset();
            setDeleteTarget(event);
          }}
        />
      </div>

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
      />

      <EventFormModal
        mode="create"
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EventFormModal
        mode="edit"
        event={editingEvent ?? undefined}
        open={editingEvent !== null}
        isSubmitting={editAction.isSubmitting}
        error={editAction.error}
        onCancel={() => setEditingEvent(null)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmActionModal
        open={deleteTarget !== null}
        icon={Trash2}
        title="Delete event"
        description={`Delete "${deleteTarget?.name}"? This removes all members, guests, and trackables. This cannot be undone.`}
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
