import { Navigate, Outlet } from "react-router-dom";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { ROUTES } from "@config/routes";

export default function RequireStaffAuth() {
  const { staffUser, isLoading } = useStaffAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!staffUser || staffUser.banned) {
    return <Navigate to={ROUTES.adminLogin} replace />;
  }

  return <Outlet />;
}
