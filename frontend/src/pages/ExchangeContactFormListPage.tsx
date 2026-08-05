import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ExchangeContactFormListView } from "@features/exchange-contact-forms";
import { createAdminExchangeContactFormApi } from "@features/exchange-contact-forms/utils/createAdminExchangeContactFormApi";
import {
  ROUTES,
  adminExchangeContactFormBuilderPath,
  adminNewExchangeContactFormPath,
} from "@config/routes";
import type { Customer } from "@app-types/customer";

export default function ExchangeContactFormListPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as {
    key: string;
    state?: { customer?: Customer };
  };
  const customer = location.state?.customer;
  const canGoBack = location.key !== "default";
  const api = useMemo(
    () => createAdminExchangeContactFormApi(customerId ?? ""),
    [customerId],
  );

  if (!customerId) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-base-content/60">Missing customer.</p>
      </div>
    );
  }

  return (
    <ExchangeContactFormListView
      api={api}
      heading={`${customer?.name ?? "Customer"}’s Exchange Contact Forms`}
      emptyStateMessage="No customizable forms yet for this customer. Tap + above to build one."
      onBack={() =>
        canGoBack ? navigate(-1) : navigate(ROUTES.adminExchangeContactForms)
      }
      onSelectForm={(form) =>
        navigate(adminExchangeContactFormBuilderPath(customerId, form.id), {
          state: { customer },
        })
      }
      onNewForm={() =>
        navigate(adminNewExchangeContactFormPath(customerId), {
          state: { customer },
        })
      }
    />
  );
}
