import { useState } from "react";
import { CircleCheck, Trash2 } from "lucide-react";
import { useStaffAuth } from "@hooks/useStaffAuth";
import type { StaffMember } from "@app-types/staffAuth";
import { useStaffList } from "@features/staff-management/hooks/useStaffList";
import { useStaffMutations } from "@features/staff-management/hooks/useStaffMutations";
import { useAsyncAction } from "@features/staff-management/hooks/useAsyncAction";
import { getStaffRowActions } from "@features/staff-management/utils/getStaffRowActions";
import StaffToolbar from "@features/staff-management/components/StaffToolbar";
import StaffTable from "@features/staff-management/components/StaffTable";
import StaffPagination from "@features/staff-management/components/StaffPagination";
import CreateStaffModal from "@features/staff-management/components/CreateStaffModal";
import EditStaffModal from "@features/staff-management/components/EditStaffModal";
import BanStaffModal from "@features/staff-management/components/BanStaffModal";
import ConfirmActionModal from "@features/staff-management/components/ConfirmActionModal";
import type { CreateStaffValues } from "@features/staff-management/schemas/createStaffSchema";
import type { EditStaffValues } from "@features/staff-management/schemas/editStaffSchema";
import type { BanStaffValues } from "@features/staff-management/schemas/banStaffSchema";

type ConfirmAction = { type: "unban" | "delete"; staff: StaffMember };

export default function StaffManagementApp() {
  const { staffUser } = useStaffAuth();
  const list = useStaffList();
  const mutations = useStaffMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [banningStaff, setBanningStaff] = useState<StaffMember | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const createAction = useAsyncAction();
  const editAction = useAsyncAction();
  const banAction = useAsyncAction();
  const confirmActionState = useAsyncAction();

  if (!staffUser) return null;

  const canAddStaff = staffUser.role === "admin" || staffUser.role === "super_admin";
  const editingActions = editingStaff ? getStaffRowActions(staffUser, editingStaff) : null;

  const handleCreateSubmit = (values: CreateStaffValues) => {
    void createAction.run(
      () => mutations.createStaff(values),
      () => setIsCreateOpen(false),
    );
  };

  const handleEditSubmit = (values: EditStaffValues) => {
    if (!editingStaff) return;
    void editAction.run(
      async () => {
        if (values.name !== editingStaff.name) {
          await mutations.updateStaffName(editingStaff.id, { name: values.name });
        }
        if (
          editingActions?.canChangeRole &&
          values.role &&
          values.role !== editingStaff.role
        ) {
          await mutations.setStaffRole(editingStaff.id, { role: values.role });
        }
      },
      () => setEditingStaff(null),
    );
  };

  const handleBanSubmit = (values: BanStaffValues) => {
    if (!banningStaff) return;
    void banAction.run(
      () =>
        mutations.banStaff(banningStaff.id, {
          banReason: values.banReason?.trim() || undefined,
        }),
      () => setBanningStaff(null),
    );
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    void confirmActionState.run(
      () =>
        confirmAction.type === "unban"
          ? mutations.unbanStaff(confirmAction.staff.id)
          : mutations.deleteStaff(confirmAction.staff.id),
      () => setConfirmAction(null),
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">Staff Management</h1>
        <p className="text-sm text-base-content/60">
          {list.total} {list.total === 1 ? "person" : "people"}
        </p>
      </div>

      <StaffToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        roleFilter={list.roleFilter}
        onRoleFilterChange={list.setRoleFilter}
        canAddStaff={canAddStaff}
        onAddStaff={() => {
          createAction.reset();
          setIsCreateOpen(true);
        }}
      />

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        <StaffTable
          staff={list.staff}
          viewer={staffUser}
          isLoading={list.isLoading}
          error={list.error}
          hasActiveFilters={Boolean(list.search || list.roleFilter)}
          onEdit={(staff) => {
            editAction.reset();
            setEditingStaff(staff);
          }}
          onBanToggle={(staff) => {
            if (staff.banned) {
              confirmActionState.reset();
              setConfirmAction({ type: "unban", staff });
            } else {
              banAction.reset();
              setBanningStaff(staff);
            }
          }}
          onDelete={(staff) => {
            confirmActionState.reset();
            setConfirmAction({ type: "delete", staff });
          }}
        />
      </div>

      <StaffPagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
      />

      <CreateStaffModal
        open={isCreateOpen}
        canAssignRole={staffUser.role === "super_admin"}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EditStaffModal
        open={editingStaff !== null}
        staff={editingStaff}
        canChangeRole={editingActions?.canChangeRole ?? false}
        isSubmitting={editAction.isSubmitting}
        error={editAction.error}
        onCancel={() => setEditingStaff(null)}
        onSubmit={handleEditSubmit}
      />

      <BanStaffModal
        open={banningStaff !== null}
        staff={banningStaff}
        isSubmitting={banAction.isSubmitting}
        error={banAction.error}
        onCancel={() => setBanningStaff(null)}
        onSubmit={handleBanSubmit}
      />

      <ConfirmActionModal
        open={confirmAction !== null}
        icon={confirmAction?.type === "delete" ? Trash2 : CircleCheck}
        title={
          confirmAction?.type === "delete"
            ? `Delete ${confirmAction.staff.name}?`
            : `Unban ${confirmAction?.staff.name}?`
        }
        description={
          confirmAction?.type === "delete"
            ? "This permanently removes their account. This can't be undone."
            : "They'll be able to sign in again."
        }
        confirmLabel={confirmAction?.type === "delete" ? "Delete" : "Unban"}
        isDestructive={confirmAction?.type === "delete"}
        isSubmitting={confirmActionState.isSubmitting}
        error={confirmActionState.error}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
