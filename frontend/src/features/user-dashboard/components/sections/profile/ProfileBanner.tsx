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

  function handleWallet(type: "google" | "apple") {
    setWalletLoading(true);
    setWalletError(null);
    setTimeout(() => {
      setWalletLoading(false);
      setWalletError(`${type === "google" ? "Google" : "Apple"} Wallet coming soon!`);
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
          onClick={() => handleWallet("google")}
          className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-full bg-neutral px-3 py-2.5 text-xs font-semibold text-neutral-content transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-left leading-tight">
            Add to<br />Google Wallet
          </span>
        </button>
        <button
          type="button"
          disabled={walletLoading}
          onClick={() => handleWallet("apple")}
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
