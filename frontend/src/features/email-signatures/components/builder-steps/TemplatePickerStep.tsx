import { Check } from "lucide-react";
import type { EmailSignatureTemplateKey } from "@app-types/emailSignature";
import { EMAIL_SIGNATURE_TEMPLATE_OPTIONS } from "@features/email-signatures/config/emailSignatureBuilder.config";

interface TemplatePickerStepProps {
  value: EmailSignatureTemplateKey;
  onChange: (value: EmailSignatureTemplateKey) => void;
}

export default function TemplatePickerStep({
  value,
  onChange,
}: TemplatePickerStepProps) {
  return (
    <div className="flex flex-col gap-3">
      {EMAIL_SIGNATURE_TEMPLATE_OPTIONS.map((template) => {
        const isSelected = template.key === value;
        return (
          <button
            key={template.key}
            type="button"
            onClick={() => onChange(template.key)}
            className={`flex min-h-11 items-center justify-between gap-3 rounded-field border px-4 py-3 text-left ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-base-300 bg-base-100 hover:bg-base-200"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-base-content">
                {template.label}
              </p>
              <p className="text-xs text-base-content/60">
                {template.description}
              </p>
            </div>
            {isSelected && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
