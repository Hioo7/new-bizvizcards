import { useState } from "react";
import type { AuthUser } from "@app-types/auth";

interface ProfileBannerProps {
  user: AuthUser;
  phone?: string;
  countryCode?: string;
  onEditProfile: () => void;
  onManageEcards?: () => void;
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
}: ProfileBannerProps) {
  const initials = getInitials(user.name);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  function handleAppleWallet() {
    setWalletLoading(true);
    setWalletError(null);
    setTimeout(() => {
      setWalletLoading(false);
      setWalletError("Apple Wallet coming soon!");
      setTimeout(() => setWalletError(null), 3000);
    }, 500);
  }

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
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-xs font-bold text-white">
            Bv
          </span>
          <span className="text-base font-bold text-white">BizVizCards</span>
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

      {/* Wallet buttons row */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={walletLoading}
          onClick={handleAppleWallet}
          className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-full bg-neutral px-3 py-2.5 text-xs font-semibold text-neutral-content transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-neutral-content" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span className="text-left leading-tight">
            Add to<br />Apple Wallet
          </span>
        </button>
      </div>

      {/* Wallet error */}
      {walletError && (
        <p className="mt-2 text-center text-xs text-white/80">{walletError}</p>
      )}
    </div>
  );
}
