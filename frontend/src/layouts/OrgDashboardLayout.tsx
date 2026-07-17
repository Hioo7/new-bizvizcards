import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { ROUTES } from "@config/routes";
import { useOrgMembers } from "@features/user-dashboard/hooks/useOrgMembers";
import { useOrganisation } from "@features/user-dashboard/hooks/useOrganisation";
import OrgMembersTab from "@features/user-dashboard/components/org/OrgMembersTab";
import OrgRequestsTab from "@features/user-dashboard/components/org/OrgRequestsTab";
import MemberEcardEditModal from "@features/user-dashboard/components/org/MemberEcardEditModal";
import MemberEcardsSheet from "@features/user-dashboard/components/org/MemberEcardsSheet";
import type { OrgMemberListItem } from "@features/user-dashboard/types";

type OrgTab = "members" | "requests" | "contacts";

export default function OrgDashboardLayout() {
  useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrgTab>("members");
  const [search, setSearch] = useState("");

  const org = useOrganisation();
  const orgMembers = useOrgMembers();

  // Per-member ecard sheet
  const [sheetMember, setSheetMember] = useState<OrgMemberListItem | null>(null);

  // Ecard edit modal
  const [editingMember, setEditingMember] = useState<OrgMemberListItem | null>(null);

  useEffect(() => {
    void org.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (org.data) {
      void orgMembers.load(org.data.organisation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.data]);

  const isSpoc = org.data?.membership.role === "SPOC";
  const currentCustomerId = org.data?.membership.customerId ?? "";

  function handleEditEcard(member: OrgMemberListItem) {
    setSheetMember(null);
    setEditingMember(member);
  }

  return (
    <div className="flex h-screen flex-col bg-base-200">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 shrink-0" style={{ backgroundColor: "var(--color-primary)" }}>
        {/* Top row */}
        <div className="flex items-start justify-between px-4 pt-8 pb-3">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.userDashboard)}
              className="mb-1 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold text-white">Members</h1>
            <p className="mt-0.5 text-sm text-white/70">
              Manage your organisation's members
            </p>
          </div>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Help"
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search row */}
        <div className="flex gap-2 px-4 pb-4">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-white py-2.5 pl-9 pr-4 text-sm text-base-content outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            aria-label="Filter"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-white/30 text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-28">
          {org.loading || orgMembers.loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-base-100 border border-base-200 p-4 flex items-center gap-4">
                  <div className="skeleton h-14 w-14 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-3 w-40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : org.error ? (
            <div className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
              {org.error}
            </div>
          ) : !org.data ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-base-content/60">
                You are not part of any organisation
              </p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.userDashboard)}
                className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-content"
              >
                Go to Dashboard
              </button>
            </div>
          ) : activeTab === "members" ? (
            <OrgMembersTab
              members={orgMembers.members}
              search={search}
              isSpoc={isSpoc}
              currentCustomerId={currentCustomerId}
              onUpdate={orgMembers.updateMember}
              onRemove={orgMembers.removeMember}
              onShowEcards={setSheetMember}
            />
          ) : activeTab === "requests" ? (
            <OrgRequestsTab
              isSpoc={isSpoc}
              invites={orgMembers.invites}
              onInvite={(payload) => orgMembers.invite(org.data!.organisation.id, payload)}
              onRevoke={orgMembers.revokeInvite}
            />
          ) : (
            /* Contacts placeholder */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-base-content/30" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-base-content/60">Contacts coming soon</p>
            </div>
          )}
        </div>
      </main>

      {/* Per-member ecard sheet */}
      <MemberEcardsSheet
        open={sheetMember !== null}
        member={sheetMember}
        onClose={() => setSheetMember(null)}
        onEditEcard={handleEditEcard}
      />

      {/* Member ecard edit modal */}
      {editingMember?.linkedEcard && org.data && (
        <MemberEcardEditModal
          open={editingMember !== null}
          organisationId={org.data.organisation.id}
          ecardId={editingMember.linkedEcard.id}
          memberName={editingMember.name}
          memberEmail={editingMember.email}
          memberProfilePicture={editingMember.profilePicture}
          onClose={() => setEditingMember(null)}
          onSaved={() => void orgMembers.load(org.data!.organisation.id)}
        />
      )}

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-2xl">
          {/* Members */}
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "members" ? "text-primary" : "text-base-content/40"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth={activeTab === "members" ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={activeTab === "members" ? "2" : "1.6"} />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth={activeTab === "members" ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Members
          </button>

          {/* Requests */}
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "requests" ? "text-primary" : "text-base-content/40"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth={activeTab === "requests" ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth={activeTab === "requests" ? "2" : "1.6"} strokeLinecap="round" />
            </svg>
            Requests
          </button>

          {/* Contacts */}
          <button
            type="button"
            onClick={() => setActiveTab("contacts")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "contacts" ? "text-primary" : "text-base-content/40"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth={activeTab === "contacts" ? "2" : "1.6"} />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth={activeTab === "contacts" ? "2" : "1.6"} strokeLinecap="round" />
            </svg>
            Contacts
          </button>
        </div>
      </nav>
    </div>
  );
}
