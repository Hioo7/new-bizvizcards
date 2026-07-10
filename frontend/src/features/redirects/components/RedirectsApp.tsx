import { useState } from "react";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { REDIRECT_TABS, type RedirectTab } from "@features/redirects/config";
import InternalRedirectsPanel from "@features/redirects/components/InternalRedirectsPanel";
import ExternalRedirectsPanel from "@features/redirects/components/ExternalRedirectsPanel";
import RestrictedPathsPanel from "@features/redirects/components/RestrictedPathsPanel";

export default function RedirectsApp() {
  const { staffUser } = useStaffAuth();
  const [activeTab, setActiveTab] = useState<RedirectTab>("internal");

  if (!staffUser) return null;

  const canManage =
    staffUser.role === "admin" || staffUser.role === "super_admin";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">
          Redirects
        </h1>
        <p className="text-sm text-base-content/60">
          Manage where old links and endpoints send visitors.
        </p>
      </div>

      <div className="flex overflow-hidden rounded-field border border-base-300">
        {REDIRECT_TABS.map((tab, index) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`min-h-11 flex-1 border-base-300 px-4 text-xs font-semibold transition-colors ${
              index > 0 ? "border-l" : ""
            } ${
              activeTab === tab.value
                ? "bg-primary text-primary-content"
                : "bg-base-100 text-base-content/70 hover:bg-base-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        {activeTab === "internal" && (
          <InternalRedirectsPanel canManage={canManage} />
        )}
        {activeTab === "external" && (
          <ExternalRedirectsPanel canManage={canManage} />
        )}
        {activeTab === "restricted" && (
          <RestrictedPathsPanel canManage={canManage} />
        )}
      </div>
    </div>
  );
}
