import { Tag } from "lucide-react";
import { BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH } from "@features/bulk-messenger/config/bulkMessenger.config";

interface TemplateBasicsValue {
  name: string;
  linkedFormId: string | null;
}

interface TemplateBasicsStepProps {
  value: TemplateBasicsValue;
  onChange: (value: TemplateBasicsValue) => void;
  forms: { id: string; name: string }[];
  formsLoading: boolean;
  formsError: string | null;
}

export default function TemplateBasicsStep({
  value,
  onChange,
  forms,
  formsLoading,
  formsError,
}: TemplateBasicsStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-base-content">
          <Tag className="h-4 w-4 text-base-content/50" />
          Template name
        </span>
        <input
          type="text"
          value={value.name}
          maxLength={BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH}
          onChange={(event) =>
            onChange({ ...value, name: event.target.value })
          }
          placeholder="e.g. Trade show follow-up"
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-base-content">
          Linked exchange contact form
        </span>
        <span className="text-xs text-base-content/50">
          Optional. Adds that form's questions as placeholders and limits the
          send to leads who filled it in.
        </span>
        <select
          value={value.linkedFormId ?? ""}
          disabled={formsLoading}
          onChange={(event) =>
            onChange({
              ...value,
              linkedFormId: event.target.value || null,
            })
          }
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        >
          <option value="">No form — all leads</option>
          {forms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.name}
            </option>
          ))}
        </select>
        {formsError && (
          <span className="text-xs text-error">{formsError}</span>
        )}
      </label>
    </div>
  );
}
