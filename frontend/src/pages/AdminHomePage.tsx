import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { getStaffSession, signOutStaff } from "@services/staffAuthService";
import type { StaffUser } from "@app-types/staffAuth";
import { ROUTES } from "@config/routes";

type ViewState = "loading" | "success";

export default function AdminHomePage() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    getStaffSession()
      .then((session) => {
        if (cancelled) return;
        if (session.user) {
          setStaffUser(session.user);
          setViewState("success");
        } else {
          navigate(ROUTES.adminLogin, { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) navigate(ROUTES.adminLogin, { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await signOutStaff();
    navigate(ROUTES.adminLogin);
  };

  if (viewState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-base-100 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h1 className="mb-1 text-2xl font-bold text-base-content">
          Welcome, {staffUser?.name}
        </h1>
        <p className="text-sm text-base-content/60">
          {staffUser?.email} · {staffUser?.role ?? "employee"}
        </p>
      </div>
      {/* TODO: replace this placeholder with the real admin dashboard once it's designed/migrated */}
      <p className="max-w-sm text-sm text-base-content/50">
        The admin dashboard hasn&apos;t been built yet — this is a placeholder
        confirming your login succeeded.
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        className="btn min-h-11 gap-2 rounded-field border border-base-300 bg-base-100 px-6 text-sm font-semibold text-base-content hover:bg-base-200"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}
