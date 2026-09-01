import { useNavigate } from "react-router-dom";
import { BulkMessengerView } from "@features/bulk-messenger";
import type { UserDashboardLocationState } from "@features/user-dashboard";
import { ROUTES } from "@config/routes";

export default function UserBulkMessengerPage() {
  const navigate = useNavigate();

  return (
    <BulkMessengerView
      onBack={() =>
        navigate(ROUTES.userDashboard, {
          state: { section: "apps" } satisfies UserDashboardLocationState,
        })
      }
    />
  );
}
