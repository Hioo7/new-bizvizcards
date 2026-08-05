import { useNavigate, useParams } from "react-router-dom";
import {
  CUSTOMER_EXCHANGE_CONTACT_FORM_API,
  ExchangeContactFormBuilderView,
} from "@features/exchange-contact-forms";
import {
  EXCHANGE_CONTACT_FORM_NEW_ID,
  ROUTES,
  userExchangeContactFormBuilderPath,
} from "@config/routes";

export default function UserExchangeContactFormBuilderPage() {
  const { formId: formIdParam } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const isNew = formIdParam === EXCHANGE_CONTACT_FORM_NEW_ID;
  const formId = isNew ? null : (formIdParam ?? null);

  if (!formIdParam) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-base-content/60">Missing form.</p>
      </div>
    );
  }

  return (
    <ExchangeContactFormBuilderView
      formId={formId}
      api={CUSTOMER_EXCHANGE_CONTACT_FORM_API}
      heading="My Exchange Contact Form"
      onBack={() => navigate(ROUTES.userExchangeContactForms)}
      onCreated={(saved) =>
        navigate(userExchangeContactFormBuilderPath(saved.id), {
          replace: true,
        })
      }
    />
  );
}
