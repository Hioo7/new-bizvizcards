import { useState } from "react";
import { DASHBOARD_APP_VERSION } from "@features/user-dashboard/config";
import {
  PWAInstallModal,
  PWA_INSTALL_ROW_DESCRIPTION_INSTALLABLE,
  PWA_INSTALL_ROW_DESCRIPTION_INSTALLED,
  PWA_INSTALL_ROW_DESCRIPTION_UNSUPPORTED,
  usePWAInstall,
} from "@features/pwa-install";

interface SettingsSectionProps {
  onSignOut: () => Promise<void>;
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 text-base-content/30"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface SettingsRowProps {
  iconBox: React.ReactNode;
  label: string;
  description?: string;
  labelClassName?: string;
  showChevron?: boolean;
  onClick?: () => void;
  href?: string;
}

function SettingsRow({
  iconBox,
  label,
  description,
  labelClassName = "text-base-content font-semibold",
  showChevron = true,
  onClick,
  href,
}: SettingsRowProps) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {iconBox}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${labelClassName}`}>{label}</p>
        {description && (
          <p className="text-xs text-base-content/50 mt-0.5">{description}</p>
        )}
      </div>
      {showChevron && <ChevronRightIcon />}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-colors hover:bg-base-200 active:bg-base-300"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="w-full text-left transition-colors hover:bg-base-200 active:bg-base-300 disabled:opacity-50"
      onClick={onClick}
    >
      {content}
    </button>
  );
}

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-base-content/40">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-4 border-t border-base-200" />;
}

export default function SettingsSection({ onSignOut }: SettingsSectionProps) {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const installRowDescription = isInstalled
    ? PWA_INSTALL_ROW_DESCRIPTION_INSTALLED
    : canInstall
      ? PWA_INSTALL_ROW_DESCRIPTION_INSTALLABLE
      : PWA_INSTALL_ROW_DESCRIPTION_UNSUPPORTED;

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky blue header */}
      <div
        className="sticky top-0 z-10 px-4 pb-5 pt-10"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-white/70 mt-0.5">
              Manage your account and preferences
            </p>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {/* Bell icon */}
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* Help icon */}
            <button
              type="button"
              aria-label="Help"
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* SUPPORT group */}
        <SettingsGroup title="Support">
          <SettingsRow
            iconBox={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>
            }
            label="Help & Support"
            description="FAQs and contact support"
            href="/support"
          />
          <Divider />
          <SettingsRow
            iconBox={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            }
            label="Privacy Policy"
            description="How we handle your data"
            href="/privacy"
          />
          <Divider />
          <SettingsRow
            iconBox={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
            }
            label="Terms of Service"
            description="Terms and conditions of use"
            href="/terms"
          />
        </SettingsGroup>

        {/* ABOUT group */}
        <SettingsGroup title="About">
          <SettingsRow
            iconBox={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            }
            label="Install App"
            description={installRowDescription}
            showChevron={canInstall}
            onClick={canInstall ? () => setIsInstallModalOpen(true) : undefined}
          />
          <Divider />
          <SettingsRow
            iconBox={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
            }
            label="App Version"
            description={`BizVizCards ${DASHBOARD_APP_VERSION}`}
            showChevron={false}
          />
        </SettingsGroup>

        {/* ACCOUNT group */}
        <SettingsGroup title="Account">
          <SettingsRow
            iconBox={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
                  <path
                    d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            }
            label="Change Password"
            description="Update your account password"
          />
          <Divider />
          <SettingsRow
            iconBox={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-error" aria-hidden="true">
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            }
            label="Sign Out"
            labelClassName="text-error font-semibold"
            description="Sign out of your account"
            showChevron={false}
            onClick={() => void onSignOut()}
          />
        </SettingsGroup>
      </div>

      <PWAInstallModal
        open={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstall={async () => {
          await triggerInstall();
          setIsInstallModalOpen(false);
        }}
      />
    </div>
  );
}
