import { useNavigate } from "react-router-dom";
import { EmailSignatureListView } from "@features/email-signatures";
import type { UserDashboardLocationState } from "@features/user-dashboard";
import { ROUTES } from "@config/routes";

export default function UserEmailSignaturesPage() {
  const navigate = useNavigate();

  return (
    <EmailSignatureListView
      onBack={() =>
        navigate(ROUTES.userDashboard, {
          state: { section: "apps" } satisfies UserDashboardLocationState,
        })
      }
    />
  );
}
