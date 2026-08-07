import { useNavigate } from "react-router-dom";
import { VirtualBackgroundListView } from "@features/virtual-backgrounds";
import type { UserDashboardLocationState } from "@features/user-dashboard";
import { ROUTES } from "@config/routes";

export default function UserVirtualBackgroundsPage() {
  const navigate = useNavigate();

  return (
    <VirtualBackgroundListView
      onBack={() =>
        navigate(ROUTES.userDashboard, {
          state: { section: "apps" } satisfies UserDashboardLocationState,
        })
      }
    />
  );
}
