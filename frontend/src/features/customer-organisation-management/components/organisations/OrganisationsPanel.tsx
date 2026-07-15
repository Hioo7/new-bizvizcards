import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncAction } from "@hooks/useAsyncAction";
import Pagination from "@components/Pagination";
import { adminOrganisationDetailPath } from "@config/routes";
import { useOrganisationManagementList } from "@features/customer-organisation-management/hooks/useOrganisationManagementList";
import { useOrganisationManagementMutations } from "@features/customer-organisation-management/hooks/useOrganisationManagementMutations";
import OrganisationToolbar from "@features/customer-organisation-management/components/organisations/OrganisationToolbar";
import OrganisationTable from "@features/customer-organisation-management/components/organisations/OrganisationTable";
import CreateOrganisationModal from "@features/customer-organisation-management/components/organisations/CreateOrganisationModal";
import type { CreateOrganisationValues } from "@features/customer-organisation-management/schemas/createOrganisationSchema";

export default function OrganisationsPanel() {
  const navigate = useNavigate();
  const list = useOrganisationManagementList();
  const mutations = useOrganisationManagementMutations(list.refetch);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createAction = useAsyncAction();

  const handleCreateSubmit = (values: CreateOrganisationValues) => {
    void createAction.run(
      async () => {
        const result = await mutations.createOrganisation(values);
        navigate(adminOrganisationDetailPath(result.organisation.id));
      },
      () => setIsCreateOpen(false),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <OrganisationToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        onAddOrganisation={() => {
          createAction.reset();
          setIsCreateOpen(true);
        }}
      />

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        <OrganisationTable
          organisations={list.organisations}
          isLoading={list.isLoading}
          error={list.error}
          hasActiveFilters={Boolean(list.search)}
          onOpen={(organisation) =>
            navigate(adminOrganisationDetailPath(organisation.id))
          }
        />
      </div>

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
      />

      <CreateOrganisationModal
        open={isCreateOpen}
        isSubmitting={createAction.isSubmitting}
        error={createAction.error}
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
}
