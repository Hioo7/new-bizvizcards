import { useNavigate } from "react-router-dom";
import TemplateCard from "@features/smart-cards/components/TemplateCard";
import { SMART_CARD_TEMPLATES } from "@features/smart-cards/config/smartCardTemplates.config";
import { adminSmartCardsListPath } from "@config/routes";

export default function TemplatePickerView() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-base-content">Smart Cards</h1>
        <p className="text-sm text-base-content/60">
          Choose a template to manage its smart cards.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SMART_CARD_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.key}
            template={template}
            onActivate={() => navigate(adminSmartCardsListPath(template.key))}
          />
        ))}
      </div>
    </div>
  );
}
