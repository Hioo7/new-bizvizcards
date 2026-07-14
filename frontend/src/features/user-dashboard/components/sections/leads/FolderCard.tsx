import type { LeadFolder } from "@features/user-dashboard/types";

interface FolderCardProps {
  folder: LeadFolder;
  leadCount: number;
  isDefault: boolean;
  onClick: () => void;
  onSetDefault: () => Promise<void>;
  onRename: () => void;
  onDelete: () => void;
}

export default function FolderCard({
  folder,
  leadCount,
  isDefault,
  onClick,
  onSetDefault,
  onRename,
  onDelete,
}: FolderCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 shadow-sm">
      {/* Folder icon box */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-primary"
          aria-hidden="true"
        >
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      </div>

      {/* Info — clickable area */}
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={onClick}
      >
        <p className="truncate font-semibold text-base-content">{folder.name}</p>
        <p className="text-sm text-primary">
          {leadCount} {leadCount === 1 ? "lead" : "leads"}
        </p>
      </button>

      {/* Action buttons */}
      <div className="flex shrink-0 gap-1.5">
        {/* Star / default */}
        <button
          type="button"
          className={`flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border ${
            isDefault
              ? "border-warning text-warning"
              : "border-base-300 text-base-content/50"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            void onSetDefault();
          }}
          aria-label={isDefault ? "Unset default folder" : "Set as default folder"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isDefault ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        {/* Pencil / rename */}
        <button
          type="button"
          className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-base-300 text-base-content/50"
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          aria-label="Rename folder"
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
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Trash / delete */}
        <button
          type="button"
          className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-error text-error-content"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete folder"
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
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
