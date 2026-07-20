import { Navigate, Outlet } from "react-router-dom";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { ROUTES } from "@config/routes";

/** Nested inside RequireStaffAuth (which already guarantees an
 * authenticated, non-banned staffUser) — this adds a super_admin-only hard
 * gate for routes like Data Migration, redirecting anyone else back to the
 * admin home rather than the login page (they are authenticated, just not
 * permitted). The backend enforces the same restriction independently via
 * PermissionsGuard — this is client-side UX, not the actual security
 * boundary. */
export default function RequireSuperAdmin() {
  const { staffUser, isLoading } = useStaffAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!staffUser || staffUser.role !== "super_admin") {
    return <Navigate to={ROUTES.adminHome} replace />;
  }

  return <Outlet />;
}
