import type { DashboardSection } from "@features/user-dashboard/types";

interface NavigationBarProps {
  active: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
}

interface NavTab {
  section: DashboardSection;
  label: string;
}

function HomeIconStroke() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIconFilled() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M2 21v-1a7 7 0 0114 0v1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="15" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="18.5" cy="14" r="1" fill="currentColor" />
      <path
        d="M16 18c0-1.1.67-1.5 2.5-1.5S21 16.9 21 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M3 17l4-5 4 3 4-7 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 10a4 4 0 01-8 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TABS: NavTab[] = [
  { section: "profile", label: "Home" },
  { section: "leads", label: "Leads" },
  { section: "analytics", label: "Analytics" },
  { section: "cart", label: "Cart" },
  { section: "settings", label: "Settings" },
];

function getIcon(section: DashboardSection, isActive: boolean) {
  switch (section) {
    case "profile":
      return isActive ? <HomeIconFilled /> : <HomeIconStroke />;
    case "leads":
      return <ContactsIcon />;
    case "analytics":
      return <AnalyticsIcon />;
    case "cart":
      return <CartIcon />;
    case "settings":
      return <SettingsIcon />;
  }
}

export default function NavigationBar({
  active,
  onNavigate,
}: NavigationBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 h-16 border-t border-base-300 bg-base-100">
      <div className="mx-auto flex h-full max-w-5xl items-center">
      {TABS.map(({ section, label }) => {
        const isActive = active === section;
        return (
          <button
            key={section}
            type="button"
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              isActive
                ? "text-primary"
                : "text-base-content/40 hover:text-base-content/60"
            }`}
            onClick={() => onNavigate(section)}
            aria-current={isActive ? "page" : undefined}
          >
            {getIcon(section, isActive)}
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        );
      })}
      </div>
    </nav>
  );
}
