import { useSearchParams } from "react-router-dom";
import ManagementTabs, {
  type ManagementTab,
} from "@features/customer-organisation-management/components/ManagementTabs";
import CustomersPanel from "@features/customer-organisation-management/components/customers/CustomersPanel";
import OrganisationsPanel from "@features/customer-organisation-management/components/organisations/OrganisationsPanel";

export default function CustomerOrganisationManagementApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: ManagementTab =
    searchParams.get("tab") === "organisations" ? "organisations" : "customers";

  const setActiveTab = (tab: ManagementTab) =>
    setSearchParams(tab === "customers" ? {} : { tab }, { replace: true });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">
          Customers &amp; Organisations
        </h1>
      </div>

      <ManagementTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "customers" ? <CustomersPanel /> : <OrganisationsPanel />}
    </div>
  );
}
