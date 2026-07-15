import { Building2, Users } from "lucide-react";

export type ManagementTab = "customers" | "organisations";

interface ManagementTabsProps {
  active: ManagementTab;
  onChange: (tab: ManagementTab) => void;
}

export default function ManagementTabs({
  active,
  onChange,
}: ManagementTabsProps) {
  return (
    <div role="tablist" className="tabs tabs-box w-full">
      <button
        type="button"
        role="tab"
        aria-selected={active === "customers"}
        onClick={() => onChange("customers")}
        className={`tab min-h-11 flex-1 gap-2 ${active === "customers" ? "tab-active" : ""}`}
      >
        <Users className="h-4 w-4" />
        Customers
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "organisations"}
        onClick={() => onChange("organisations")}
        className={`tab min-h-11 flex-1 gap-2 ${active === "organisations" ? "tab-active" : ""}`}
      >
        <Building2 className="h-4 w-4" />
        Organisations
      </button>
    </div>
  );
}
