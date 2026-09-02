import { useNavigate } from "react-router-dom";
import { ConnectedAppsView } from "@features/connected-apps";
import type { UserDashboardLocationState } from "@features/user-dashboard";
import { ROUTES } from "@config/routes";

export default function UserConnectedAppsPage() {
  const navigate = useNavigate();

  return (
    <ConnectedAppsView
      onBack={() =>
        navigate(ROUTES.userDashboard, {
          state: { section: "apps" } satisfies UserDashboardLocationState,
        })
      }
    />
  );
}
