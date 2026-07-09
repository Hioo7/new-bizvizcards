import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { useStaffAuth } from "@hooks/useStaffAuth";
import StaffAvatar from "@components/StaffAvatar";
import { ROUTES } from "@config/routes";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { staffUser } = useStaffAuth();

  const isAppsGrid = location.pathname === ROUTES.adminHome;

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-base-300 bg-base-100/90 px-4 backdrop-blur-sm sm:px-6">
        {isAppsGrid ? (
          <span
            aria-label="Admin"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-base-200 text-base-content/50"
          >
            <LayoutGrid className="h-5 w-5" />
          </span>
        ) : (
          <button
            type="button"
            aria-label="Back to apps"
            onClick={() => navigate(ROUTES.adminHome)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-base-content/70 transition-colors hover:bg-base-200"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        )}

        {staffUser && (
          <div className="flex items-center gap-2.5">
            <span className="hidden text-sm font-medium text-base-content sm:inline">
              {staffUser.name}
            </span>
            <StaffAvatar role={staffUser.role} size="sm" />
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
