import { useState } from "react";
import type {
  Lead,
  LeadFolder,
  CreateLeadPayload,
  UpdateLeadPayload,
} from "@features/user-dashboard/types";
import {
  RECENT_LEADS_MAX,
  LEADS_FOLDERS_PREVIEW_MAX,
} from "@features/user-dashboard/config";
import LeadCard from "./LeadCard";
import FolderCard from "./FolderCard";
import CreateLeadModal from "./CreateLeadModal";
import CreateFolderModal from "./CreateFolderModal";
import RenameFolderModal from "./RenameFolderModal";
import DeleteFolderModal from "./DeleteFolderModal";
import LeadDetailModal from "./LeadDetailModal";

interface LeadsSectionProps {
  leads: Lead[];
  folders: LeadFolder[];
  defaultFolderId: string | null;
  loading: boolean;
  error: string | null;
  onCreateLead: (payload: CreateLeadPayload) => Promise<void>;
  onUpdateLead: (id: string, payload: UpdateLeadPayload) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onCreateFolder: (name: string) => Promise<void>;
  onSetDefaultFolder: (id: string | null) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onDeleteFolder: (id: string, mode: "move" | "delete") => Promise<void>;
}

type ActiveTab = "folders" | "leads";

export default function LeadsSection({
  leads,
  folders,
  defaultFolderId,
  loading,
  error,
  onCreateLead,
  onUpdateLead,
  onDeleteLead,
  onCreateFolder,
  onSetDefaultFolder,
  onRenameFolder,
  onDeleteFolder,
}: LeadsSectionProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilterId, setFolderFilterId] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  // Derive from the leads prop so the detail view always reflects the latest state
  // after any update (e.g. stage change) without needing a separate sync.
  const selectedLead = selectedLeadId
    ? (leads.find((l) => l.id === selectedLeadId) ?? null)
    : null;
  const [renamingFolder, setRenamingFolder] = useState<LeadFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<LeadFolder | null>(null);

  const q = searchQuery.toLowerCase();

  const displayedFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(q),
  );

  const allFilteredLeads = leads.filter((l) => {
    const matchesFolder = folderFilterId ? l.folderId === folderFilterId : true;
    const matchesSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      (l.email ?? "").toLowerCase().includes(q) ||
      (l.phoneNumber ?? "").toLowerCase().includes(q);
    return matchesFolder && matchesSearch;
  });

  const selectedFolder = folderFilterId
    ? (folders.find((f) => f.id === folderFilterId) ?? null)
    : null;

  function handleFolderSelect(id: string) {
    setFolderFilterId(id);
    setShowFolderDropdown(false);
    setActiveTab("leads");
  }

  function handleClearFolderFilter() {
    setFolderFilterId(null);
    setShowFolderDropdown(false);
  }

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {/* Row 1 */}
        <div className="flex items-start justify-between px-4 pt-8 pb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-sm text-white/70">Manage your leads and folders</p>
          </div>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 text-white"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            <button
              type="button"
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 text-white"
              aria-label="Help"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search leads or folders"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-white py-2.5 pl-9 pr-4 text-sm text-base-content outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            aria-label="Export"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-white/30 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4 pb-28">
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Filter pills row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* All Leads pill */}
          <button
            type="button"
            onClick={handleClearFolderFilter}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              folderFilterId === null
                ? "bg-primary text-primary-content"
                : "border border-base-300 bg-base-100 text-base-content/60"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            All Leads
          </button>

          {/* Folder filter pill */}
          <div className="relative">
            {showFolderDropdown && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFolderDropdown(false)}
              />
            )}
            <button
              type="button"
              onClick={() => setShowFolderDropdown((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                folderFilterId !== null
                  ? "bg-primary text-primary-content"
                  : "border border-base-300 bg-base-100 text-base-content/60"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
              {selectedFolder?.name ?? "Select folder"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showFolderDropdown && folders.length > 0 && (
              <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-lg">
                <button
                  type="button"
                  onClick={handleClearFolderFilter}
                  className="w-full px-4 py-2.5 text-left text-sm text-base-content/60 hover:bg-base-200"
                >
                  All folders
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFolderSelect(f.id)}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-base-200 ${
                      folderFilterId === f.id
                        ? "font-medium text-primary"
                        : "text-base-content"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex border-b border-base-300">
          <button
            type="button"
            onClick={() => setActiveTab("folders")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "folders"
                ? "border-primary text-primary"
                : "border-transparent text-base-content/40 hover:text-base-content/60"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            Folders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "leads"
                ? "border-primary text-primary"
                : "border-transparent text-base-content/40 hover:text-base-content/60"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Leads
          </button>
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <div className="skeleton h-11 w-11 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        ) : activeTab === "folders" ? (
          /* ── Folders tab ─────────────────────────────────────────── */
          <div>
            {/* Folders tab header with create button */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-base-content">Folders</h2>
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(true)}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-content shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                New Folder
              </button>
            </div>
            {displayedFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-base-content/30"
                    aria-hidden="true"
                  >
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-base-content/60">
                  No folders yet
                </p>
                <p className="mt-1 text-xs text-base-content/40">
                  Tap &ldquo;New Folder&rdquo; above to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    leadCount={leads.filter((l) => l.folderId === folder.id).length}
                    isDefault={defaultFolderId === folder.id}
                    onClick={() => {
                      setFolderFilterId(folder.id);
                      setActiveTab("leads");
                    }}
                    onSetDefault={() =>
                      onSetDefaultFolder(
                        folder.id === defaultFolderId ? null : folder.id,
                      )
                    }
                    onRename={() => setRenamingFolder(folder)}
                    onDelete={() => setDeletingFolder(folder)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : /* ── Leads tab ───────────────────────────────────────────── */
        folderFilterId === null ? (
          /* Combined dashboard: folders snippet + recent leads */
          <div className="space-y-6">
            {/* Folders snippet */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-base-content">Folders</h2>
                {folders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("folders")}
                    className="text-xs font-medium text-primary"
                  >
                    View all
                  </button>
                )}
              </div>
              {folders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-base-content/50">No folders yet</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateFolderModal(true)}
                    className="mt-2 text-xs font-medium text-primary"
                  >
                    Create a folder
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {folders.slice(0, LEADS_FOLDERS_PREVIEW_MAX).map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      leadCount={
                        leads.filter((l) => l.folderId === folder.id).length
                      }
                      isDefault={defaultFolderId === folder.id}
                      onClick={() => handleFolderSelect(folder.id)}
                      onSetDefault={() =>
                        onSetDefaultFolder(
                          folder.id === defaultFolderId ? null : folder.id,
                        )
                      }
                      onRename={() => setRenamingFolder(folder)}
                      onDelete={() => setDeletingFolder(folder)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent leads snippet */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-base-content">
                  Recent Leads
                </h2>
                <div className="flex items-center gap-2">
                  {leads.length > RECENT_LEADS_MAX && (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary"
                    >
                      View all
                    </button>
                  )}
                  {leads.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCreateLeadModal(true)}
                      className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-content shadow-sm hover:opacity-90 active:scale-95 transition-all"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Add Lead
                    </button>
                  )}
                </div>
              </div>
              {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-base-content/30"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-base-content/60">No leads yet</p>
                  <p className="mt-1 text-xs text-base-content/40">Add your first lead to get started</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateLeadModal(true)}
                    className="mt-4 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-content shadow-sm hover:opacity-90 active:scale-95 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add your first lead
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.slice(0, RECENT_LEADS_MAX).map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={(l) => setSelectedLeadId(l.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Filtered by folder */
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-base-content">
                Leads in &ldquo;{selectedFolder?.name}&rdquo;
              </h2>
              <div className="flex items-center gap-2">
                {allFilteredLeads.length > 0 && (
                  <span className="text-xs text-base-content/50">
                    {allFilteredLeads.length}{" "}
                    {allFilteredLeads.length === 1 ? "lead" : "leads"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowCreateLeadModal(true)}
                  className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-content shadow-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Add Lead
                </button>
              </div>
            </div>
            {allFilteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-base-content/30"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-base-content/60">
                  No leads in this folder
                </p>
                <p className="mt-1 text-xs text-base-content/40">
                  Tap &ldquo;Add Lead&rdquo; above to add one here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allFilteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={(l) => setSelectedLeadId(l.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLeadModal
        open={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        onSubmit={onCreateLead}
        defaultFolderId={folderFilterId ?? defaultFolderId}
      />

      <CreateFolderModal
        open={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSubmit={onCreateFolder}
      />

      <RenameFolderModal
        key={renamingFolder?.id ?? "rename-none"}
        open={renamingFolder !== null}
        folder={renamingFolder}
        onSave={onRenameFolder}
        onClose={() => setRenamingFolder(null)}
      />

      <DeleteFolderModal
        open={deletingFolder !== null}
        folder={deletingFolder}
        onDelete={onDeleteFolder}
        onClose={() => setDeletingFolder(null)}
      />

      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLeadId(null)}
        onDelete={onDeleteLead}
        onUpdate={onUpdateLead}
      />
    </div>
  );
}
