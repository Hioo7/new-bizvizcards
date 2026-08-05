import { useNavigate } from "react-router-dom";
import {
  CUSTOMER_EXCHANGE_CONTACT_FORM_API,
  ExchangeContactFormListView,
} from "@features/exchange-contact-forms";
import type { UserDashboardLocationState } from "@features/user-dashboard";
import {
  ROUTES,
  userExchangeContactFormBuilderPath,
  userNewExchangeContactFormPath,
} from "@config/routes";

export default function UserExchangeContactFormsPage() {
  const navigate = useNavigate();

  return (
    <ExchangeContactFormListView
      api={CUSTOMER_EXCHANGE_CONTACT_FORM_API}
      heading="My Exchange Contact Forms"
      emptyStateMessage="No forms yet. Tap + above to build one."
      onBack={() =>
        navigate(ROUTES.userDashboard, {
          state: { section: "apps" } satisfies UserDashboardLocationState,
        })
      }
      onSelectForm={(form) =>
        navigate(userExchangeContactFormBuilderPath(form.id))
      }
      onNewForm={() => navigate(userNewExchangeContactFormPath())}
    />
  );
}
