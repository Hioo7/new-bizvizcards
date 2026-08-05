import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ExchangeContactFormBuilderView } from "@features/exchange-contact-forms";
import { createAdminExchangeContactFormApi } from "@features/exchange-contact-forms/utils/createAdminExchangeContactFormApi";
import {
  EXCHANGE_CONTACT_FORM_NEW_ID,
  adminCustomerExchangeContactFormsPath,
  adminExchangeContactFormBuilderPath,
} from "@config/routes";
import type { Customer } from "@app-types/customer";

export default function ExchangeContactFormBuilderPage() {
  const { customerId, formId: formIdParam } = useParams<{
    customerId: string;
    formId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation() as {
    key: string;
    state?: { customer?: Customer };
  };
  const customer = location.state?.customer;
  const canGoBack = location.key !== "default";
  const isNew = formIdParam === EXCHANGE_CONTACT_FORM_NEW_ID;
  const formId = isNew ? null : (formIdParam ?? null);
  const api = useMemo(
    () => createAdminExchangeContactFormApi(customerId ?? ""),
    [customerId],
  );

  if (!customerId || !formIdParam) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-base-content/60">Missing customer.</p>
      </div>
    );
  }

  return (
    <ExchangeContactFormBuilderView
      formId={formId}
      api={api}
      heading={`${customer?.name ?? "Customer"}’s Exchange Contact Form`}
      onBack={() =>
        canGoBack
          ? navigate(-1)
          : navigate(adminCustomerExchangeContactFormsPath(customerId), {
              state: { customer },
            })
      }
      onCreated={(saved) =>
        navigate(adminExchangeContactFormBuilderPath(customerId, saved.id), {
          replace: true,
          state: { customer },
        })
      }
    />
  );
}
