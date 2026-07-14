interface ProfileContactCardProps {
  phone: string;
  countryCode: string;
  email: string;
  onEdit: () => void;
}

export default function ProfileContactCard({
  phone,
  countryCode,
  email,
  onEdit,
}: ProfileContactCardProps) {
  const displayPhone = phone
    ? `${countryCode ? countryCode + " " : ""}${phone}`
    : "--";

  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base-content">Contact</h2>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-primary min-h-[44px] px-2"
        >
          Edit
        </button>
      </div>

      {/* Mobile row */}
      <div className="flex items-center gap-3 py-3 border-b border-base-300">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
            <path
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-base-content">Mobile</p>
          <p className="text-sm text-base-content/70 truncate">{displayPhone}</p>
        </div>
      </div>

      {/* Email row */}
      <div className="flex items-center gap-3 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
            <path
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-base-content">Email</p>
          <p className="text-sm text-base-content/70 truncate">{email}</p>
        </div>
      </div>
    </div>
  );
}
