import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { ROUTES } from "@config/routes";

export default function RequireAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
}
