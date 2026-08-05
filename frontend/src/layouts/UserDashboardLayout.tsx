import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { useMyEffectivePolicy } from "@hooks/useMyEffectivePolicy";
import { ROUTES } from "@config/routes";
import type {
  DashboardSection,
  UserDashboardLocationState,
} from "@features/user-dashboard/types";
import { useLeads } from "@features/user-dashboard/hooks/useLeads";
import { useCustomerEcards } from "@features/user-dashboard/hooks/useCustomerEcards";
import NavigationBar from "@features/user-dashboard/components/NavigationBar";
import ProfileSection from "@features/user-dashboard/components/sections/profile/ProfileSection";
import LeadsSection from "@features/user-dashboard/components/sections/leads/LeadsSection";
import InsightsSection from "@features/user-dashboard/components/sections/InsightsSection";
import SettingsSection from "@features/user-dashboard/components/sections/SettingsSection";
import CartSection from "@features/user-dashboard/components/sections/CartSection";
import AppsSection from "@features/user-dashboard/components/sections/AppsSection";

export default function UserDashboardLayout() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { policy, isLoading: policyLoading } = useMyEffectivePolicy();
  const location = useLocation();
  const initialSection =
    (location.state as UserDashboardLocationState | null)?.section ??
    "profile";
  const [activeSection, setActiveSection] =
    useState<DashboardSection>(initialSection);

  const {
    leads,
    folders,
    defaultFolderId,
    loading: leadsLoading,
    error: leadsError,
    loadAll,
    createLead,
    updateLead,
    deleteLead,
    createFolder,
    renameFolder,
    deleteFolder,
    setDefaultFolder,
  } = useLeads();

  const customerEcards = useCustomerEcards();

  // Derive access flags — false until policy resolves (avoids loading locked data)
  const leadsAccessible = !policyLoading && (policy?.leadsViewAccess ?? false);
  const ecardAvailable = !policyLoading && (policy?.ecard.isAvailable ?? false);
  const orgAvailable =
    !policyLoading && (policy?.organisation.isAvailable ?? false);

  // Only load leads data when the plan allows it
  useEffect(() => {
    if (user && leadsAccessible) {
      void loadAll();
    }
  }, [user, leadsAccessible, loadAll]);

  // Loaded once on mount when available — feeds the Analytics e-card picker
  useEffect(() => {
    if (user && ecardAvailable) {
      void customerEcards.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ecardAvailable]);

  if (authLoading || (!!user && policyLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  function renderSection() {
    if (!user) return null;

    switch (activeSection) {
      case "profile":
        return (
          <ProfileSection
            user={user}
            ecardAvailable={ecardAvailable}
            orgAvailable={orgAvailable}
            onOpenSettings={() => setActiveSection("settings")}
          />
        );
      case "leads":
        return (
          <LeadsSection
            leads={leads}
            folders={folders}
            defaultFolderId={defaultFolderId}
            loading={leadsLoading}
            error={leadsError}
            isAccessible={leadsAccessible}
            onCreateLead={createLead}
            onUpdateLead={updateLead}
            onDeleteLead={deleteLead}
            onCreateFolder={createFolder}
            onSetDefaultFolder={setDefaultFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
          />
        );
      case "analytics":
        return (
          <InsightsSection
            leads={leads}
            loading={leadsLoading}
            error={leadsError}
            isAccessible={leadsAccessible}
            ecards={ecardAvailable ? customerEcards.ecards : []}
          />
        );
      case "cart":
        return <CartSection />;
      case "apps":
        return <AppsSection />;
      case "settings":
        return (
          <SettingsSection
            onSignOut={signOut}
            onBack={() => setActiveSection("profile")}
          />
        );
      default:
        return (
          <ProfileSection
            user={user}
            ecardAvailable={ecardAvailable}
            orgAvailable={orgAvailable}
            onOpenSettings={() => setActiveSection("settings")}
          />
        );
    }
  }

  return (
    <div className="flex h-screen flex-col bg-base-200">
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl pb-24">{renderSection()}</div>
      </main>

      <NavigationBar active={activeSection} onNavigate={setActiveSection} />
    </div>
  );
}
