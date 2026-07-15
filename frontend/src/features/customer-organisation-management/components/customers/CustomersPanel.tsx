import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { useAsyncAction } from "@hooks/useAsyncAction";
import ConfirmActionModal from "@components/ConfirmActionModal";
import Pagination from "@components/Pagination";
import { adminCustomerEcardsPath } from "@config/routes";
import type { Customer } from "@app-types/customer";
import { useCustomerManagementList } from "@features/customer-organisation-management/hooks/useCustomerManagementList";
import { useCustomerManagementMutations } from "@features/customer-organisation-management/hooks/useCustomerManagementMutations";
import { isAdminTier } from "@features/customer-organisation-management/utils/isAdminTier";
import CustomerToolbar from "@features/customer-organisation-management/components/customers/CustomerToolbar";
import CustomerTable from "@features/customer-organisation-management/components/customers/CustomerTable";
import CreateCustomerModal from "@features/customer-organisation-management/components/customers/CreateCustomerModal";
import EditCustomerModal from "@features/customer-organisation-management/components/customers/EditCustomerModal";
import SetCustomerPasswordModal from "@features/customer-organisation-management/components/customers/SetCustomerPasswordModal";
import BanCustomerModal from "@features/customer-organisation-management/components/customers/BanCustomerModal";
import type { CreateCustomerValues } from "@features/customer-organisation-management/schemas/createCustomerSchema";
import type { EditCustomerValues } from "@features/customer-organisation-management/schemas/editCustomerSchema";
import type { SetCustomerPasswordValues } from "@features/customer-organisation-management/schemas/setCustomerPasswordSchema";
import type { BanCustomerValues } from "@features/customer-organisation-management/schemas/banCustomerSchema";

export default function CustomersPanel() {
  const { staffUser } = useStaffAuth();
  const navigate = useNavigate();
  const list = useCustomerManagementList();
  const mutations = useCustomerManagementMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [settingPasswordFor, setSettingPasswordFor] = useState<Customer | null>(
    null,
  );
  const [banningCustomer, setBanningCustomer] = useState<Customer | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<Customer | null>(null);

  const createAction = useAsyncAction();
  const editAction = useAsyncAction();
  const setPasswordAction = useAsyncAction();
  const banAction = useAsyncAction();
  const unbanAction = useAsyncAction();

  if (!staffUser) return null;

  const canBan = isAdminTier(staffUser.role);

  const handleCreateSubmit = (values: CreateCustomerValues) => {
    void createAction.run(
      () => mutations.createCustomer(values),
      () => setIsCreateOpen(false),
    );
  };

  const handleEditSubmit = (values: EditCustomerValues) => {
    if (!editingCustomer) return;
    void editAction.run(
      () => mutations.updateCustomer(editingCustomer.id, values),
      () => setEditingCustomer(null),
    );
  };

  const handleSetPasswordSubmit = (values: SetCustomerPasswordValues) => {
    if (!settingPasswordFor) return;
    void setPasswordAction.run(
      () => mutations.setCustomerPassword(settingPasswordFor.id, values),
      () => setSettingPasswordFor(null),
    );
  };

  const handleBanSubmit = (values: BanCustomerValues) => {
    if (!banningCustomer) return;
    void banAction.run(
      () =>
        mutations.banCustomer(banningCustomer.id, {
          banReason: values.banReason?.trim() || undefined,
        }),
      () => setBanningCustomer(null),
    );
  };

  const handleUnbanConfirm = () => {
    if (!unbanTarget) return;
    void unbanAction.run(
      () => mutations.unbanCustomer(unbanTarget.id),
      () => setUnbanTarget(null),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <CustomerToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        onAddCustomer={() => {
          createAction.reset();
          setIsCreateOpen(true);
        }}
      />

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        <CustomerTable
          customers={list.customers}
          canBan={canBan}
          isLoading={list.isLoading}
          error={list.error}
          hasActiveFilters={Boolean(list.search)}
          onEdit={(customer) => {
            editAction.reset();
            setEditingCustomer(customer);
          }}
          onSetPassword={(customer) => {
            setPasswordAction.reset();
            setSettingPasswordFor(customer);
          }}
          onBanToggle={(customer) => {
            if (customer.banned) {
              unbanAction.reset();
              setUnbanTarget(customer);
            } else {
              banAction.reset();
              setBanningCustomer(customer);
            }
          }}
          onManageEcards={(customer) =>
            navigate(adminCustomerEcardsPath(customer.id), {
              state: { customer },
            })
          }
        />
      </div>

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
      />

      <CreateCustomerModal
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EditCustomerModal
        open={editingCustomer !== null}
        customer={editingCustomer}
        isSubmitting={editAction.isSubmitting}
        error={editAction.error}
        onCancel={() => setEditingCustomer(null)}
        onSubmit={handleEditSubmit}
      />

      <SetCustomerPasswordModal
        open={settingPasswordFor !== null}
        customer={settingPasswordFor}
        isSubmitting={setPasswordAction.isSubmitting}
        error={setPasswordAction.error}
        onCancel={() => setSettingPasswordFor(null)}
        onSubmit={handleSetPasswordSubmit}
      />

      <BanCustomerModal
        open={banningCustomer !== null}
        customer={banningCustomer}
        isSubmitting={banAction.isSubmitting}
        error={banAction.error}
        onCancel={() => setBanningCustomer(null)}
        onSubmit={handleBanSubmit}
      />

      <ConfirmActionModal
        open={unbanTarget !== null}
        icon={CircleCheck}
        title={`Unban ${unbanTarget?.name}?`}
        description="They'll be able to sign in again."
        confirmLabel="Unban"
        isSubmitting={unbanAction.isSubmitting}
        error={unbanAction.error}
        onCancel={() => setUnbanTarget(null)}
        onConfirm={handleUnbanConfirm}
      />
    </div>
  );
}
