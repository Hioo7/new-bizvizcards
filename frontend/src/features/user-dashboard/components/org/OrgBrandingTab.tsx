import { useEffect, useState } from "react";
import { ClipboardList, IdCard, Lock } from "lucide-react";
import { getEffectivePolicy } from "@services/planService";
import EcardBrandingPanel from "@features/user-dashboard/components/org/EcardBrandingPanel";
import ExchangeContactFormBrandingPanel from "@features/user-dashboard/components/org/ExchangeContactFormBrandingPanel";
import LockedFeaturePanel from "@features/user-dashboard/components/org/LockedFeaturePanel";

type BrandingSubTab = "ecard" | "exchangeContactForm";

interface OrgBrandingTabProps {
  organisationId: string;
  organisationName: string;
}

export default function OrgBrandingTab({
  organisationId,
  organisationName,
}: OrgBrandingTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<BrandingSubTab>("ecard");
  const [isEcardAvailable, setIsEcardAvailable] = useState(true);
  const [isCustomFormAvailable, setIsCustomFormAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getEffectivePolicy().then((policy) => {
      if (cancelled) return;
      setIsEcardAvailable(policy.organisation.orgEcardPolicy.isAvailable);
      setIsCustomFormAvailable(
        policy.organisation.orgEcardPolicy.isAvailable &&
          policy.organisation.orgEcardPolicy.isCustomFormAvailable,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isEcardLocked = !isEcardAvailable;
  const isExchangeContactFormLocked = !isCustomFormAvailable;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="tabs tabs-box w-full">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === "ecard"}
          onClick={() => setActiveSubTab("ecard")}
          className={`tab min-h-11 flex-1 gap-2 ${activeSubTab === "ecard" ? "tab-active" : ""}`}
        >
          <IdCard className="h-4 w-4" />
          E-card branding
          {isEcardLocked && <Lock className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === "exchangeContactForm"}
          onClick={() => setActiveSubTab("exchangeContactForm")}
          className={`tab min-h-11 flex-1 gap-2 ${activeSubTab === "exchangeContactForm" ? "tab-active" : ""}`}
        >
          <ClipboardList className="h-4 w-4" />
          Exchange contact form
          {isExchangeContactFormLocked && <Lock className="h-3.5 w-3.5" />}
        </button>
      </div>

      {activeSubTab === "ecard" &&
        (isEcardLocked ? (
          <LockedFeaturePanel
            icon={IdCard}
            title="E-card branding not available on your plan"
            subtitle="Upgrade your plan to set organisation-wide e-card branding"
          />
        ) : (
          <EcardBrandingPanel
            organisationId={organisationId}
            organisationName={organisationName}
          />
        ))}

      {activeSubTab === "exchangeContactForm" &&
        (isExchangeContactFormLocked ? (
          <LockedFeaturePanel
            icon={ClipboardList}
            title="Exchange contact forms not available on your plan"
            subtitle="Upgrade your plan to set an organisation-wide exchange contact form"
          />
        ) : (
          <ExchangeContactFormBrandingPanel organisationId={organisationId} />
        ))}
    </div>
  );
}
