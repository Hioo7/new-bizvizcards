import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { ROUTES } from "@config/routes";
import type { DashboardSection } from "@features/user-dashboard/types";
import { useLeads } from "@features/user-dashboard/hooks/useLeads";
import NavigationBar from "@features/user-dashboard/components/NavigationBar";
import ProfileSection from "@features/user-dashboard/components/sections/profile/ProfileSection";
import LeadsSection from "@features/user-dashboard/components/sections/leads/LeadsSection";
import InsightsSection from "@features/user-dashboard/components/sections/InsightsSection";
import SettingsSection from "@features/user-dashboard/components/sections/SettingsSection";
import CartSection from "@features/user-dashboard/components/sections/CartSection";

export default function UserDashboardLayout() {
  const { user, isLoading, signOut } = useAuth();
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("profile");

  const {
    leads,
    folders,
    defaultFolderId,
    loading: leadsLoading,
    error: leadsError,
    loadAll,
    createLead,
    deleteLead,
    createFolder,
    renameFolder,
    deleteFolder,
    setDefaultFolder,
  } = useLeads();

  useEffect(() => {
    if (user) {
      void loadAll();
    }
  }, [user, loadAll]);

  if (isLoading) {
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
        return <ProfileSection user={user} />;
      case "leads":
        return (
          <LeadsSection
            leads={leads}
            folders={folders}
            defaultFolderId={defaultFolderId}
            loading={leadsLoading}
            error={leadsError}
            onCreateLead={createLead}
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
          />
        );
      case "cart":
        return <CartSection />;
      case "settings":
        return <SettingsSection onSignOut={signOut} />;
      default:
        return <ProfileSection user={user} />;
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
