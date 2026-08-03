import { Settings } from "lucide-react";
import type { AuthUser } from "@app-types/auth";

interface ProfileBannerProps {
  user: AuthUser;
  phone?: string;
  countryCode?: string;
  onEditProfile: () => void;
  onManageEcards?: () => void;
  onOpenSettings: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileBanner({
  user,
  phone,
  countryCode,
  onEditProfile,
  onManageEcards,
  onOpenSettings,
}: ProfileBannerProps) {
  const initials = getInitials(user.name);

  const displayPhone =
    phone
      ? `${countryCode ? countryCode + " " : ""}${phone}`
      : null;

  return (
    <div
      className="relative px-4 pb-16 pt-4"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/25 hover:border-white/50 active:scale-95"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit Profile */}
          <button
            type="button"
            onClick={onEditProfile}
            aria-label="Edit profile"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/25 hover:border-white/50 active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
              <path
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {/* Manage E-Cards */}
          {onManageEcards && (
            <button
              type="button"
              onClick={onManageEcards}
              aria-label="Manage e-cards"
              className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/25 hover:border-white/50 active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M2 10h20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M6 15h4M6 17h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-white/70"
            />
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/70"
            >
              <span className="text-2xl font-bold text-white">
                {initials}
              </span>
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold text-white">{user.name}</h1>
        <p className="text-sm text-white/80">{user.email}</p>
        {displayPhone && (
          <p className="text-sm text-white/70">{displayPhone}</p>
        )}
      </div>
    </div>
  );
}
