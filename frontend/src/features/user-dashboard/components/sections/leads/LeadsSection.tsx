import { useState } from "react";
import type {
  Lead,
  LeadFolder,
  CreateLeadPayload,
} from "@features/user-dashboard/types";
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
  onDeleteLead,
  onCreateFolder,
  onSetDefaultFolder,
  onRenameFolder,
  onDeleteFolder,
}: LeadsSectionProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("folders");
  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilterId, setFolderFilterId] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<LeadFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<LeadFolder | null>(null);

  const q = searchQuery.toLowerCase();

  const displayedFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(q),
  );

  const displayedLeads = leads.filter((l) => {
    const matchesFolder = folderFilterId ? l.folderId === folderFilterId : true;
    const matchesSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      (l.email ?? "").toLowerCase().includes(q) ||
      (l.phoneNumber ?? "").toLowerCase().includes(q);
    return matchesFolder && matchesSearch;
  });

  const selectedFolderName = folderFilterId
    ? (folders.find((f) => f.id === folderFilterId)?.name ?? null)
    : null;

  function handlePlusClick() {
    if (activeTab === "folders") {
      setShowCreateFolderModal(true);
    } else {
      setShowCreateLeadModal(true);
    }
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

        {/* Row 2: search + download + plus */}
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
          <button
            type="button"
            aria-label="Add"
            onClick={handlePlusClick}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4 pb-24">
        {/* Error */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Filter pills row */}
        <div className="mb-4 flex flex-wrap gap-2">
          {/* All Leads pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-white">
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
          </div>

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
              className="flex items-center gap-1.5 rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-sm font-medium text-base-content/60"
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
              {selectedFolderName ?? "No folder selected"}
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

            {/* Dropdown */}
            {showFolderDropdown && folders.length > 0 && (
              <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setFolderFilterId(null);
                    setShowFolderDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-base-content/60 hover:bg-base-200"
                >
                  All folders
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFolderFilterId(f.id);
                      setShowFolderDropdown(false);
                      setActiveTab("leads");
                    }}
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "folders" ? (
          displayedFolders.length === 0 ? (
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
                Tap + to create a folder
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
          )
        ) : displayedLeads.length === 0 ? (
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
              No leads yet
            </p>
            <p className="mt-1 text-xs text-base-content/40">
              Tap + to add your first contact
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
            {displayedLeads.map((lead, i) => (
              <div key={lead.id}>
                {i > 0 && <div className="mx-4 border-t border-base-200" />}
                <div className="px-2 py-1">
                  <LeadCard lead={lead} onClick={(l) => setSelectedLead(l)} />
                </div>
              </div>
            ))}
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
        onClose={() => setSelectedLead(null)}
        onDelete={onDeleteLead}
      />
    </div>
  );
}
