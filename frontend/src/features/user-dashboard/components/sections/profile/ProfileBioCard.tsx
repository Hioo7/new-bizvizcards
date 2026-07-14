interface ProfileBioCardProps {
  profession: string;
  about: string;
  description: string;
  onEdit: () => void;
}

export default function ProfileBioCard({
  profession,
  about,
  description,
  onEdit,
}: ProfileBioCardProps) {
  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base-content">Professional Bio</h2>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-primary min-h-[44px] px-2"
        >
          Edit
        </button>
      </div>

      {/* Profession row */}
      <div className="flex items-center gap-3 py-3 border-b border-base-300">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
            <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-base-content">Profession</p>
          <p className="text-sm text-base-content/70 truncate">{profession || "--"}</p>
        </div>
      </div>

      {/* About row */}
      <div className="flex items-start gap-3 py-3 border-b border-base-300">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M12 8h.01M11 12h1v4h1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-base-content">About</p>
          <p className="text-sm text-base-content/70 whitespace-pre-wrap">{about || "--"}</p>
        </div>
      </div>

      {/* Description row */}
      <div className="flex items-start gap-3 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
            <path
              d="M9 12h6M9 16h6M17 3H7a2 2 0 00-2 2v16l3-2 2 2 2-2 2 2 2-2 3 2V5a2 2 0 00-2-2z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-base-content">Description</p>
          <p className="text-sm text-base-content/70 whitespace-pre-wrap">{description || "--"}</p>
        </div>
      </div>
    </div>
  );
}
