import { MessageSquareText } from "lucide-react";
import EmptyStepState from "@components/EmptyStepState";
import type { BulkMessageTemplateSummary } from "@app-types/bulkMessenger";

interface SendTemplatePickerStepProps {
  templates: BulkMessageTemplateSummary[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onGoToTemplates: () => void;
}

export default function SendTemplatePickerStep({
  templates,
  isLoading,
  error,
  selectedId,
  onSelect,
  onGoToTemplates,
}: SendTemplatePickerStepProps) {
  if (isLoading) {
    return <p className="text-sm text-base-content/50">Loading templates…</p>;
  }
  if (error) {
    return <p className="text-sm text-error">{error}</p>;
  }
  if (templates.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyStepState
          icon={MessageSquareText}
          message="You don't have any templates yet."
        />
        <button
          type="button"
          onClick={onGoToTemplates}
          className="btn min-h-11 self-start rounded-field bg-primary text-primary-content hover:bg-primary/90"
        >
          Go to Templates
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {templates.map((template) => {
        const isSelected = template.id === selectedId;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`flex flex-col gap-1 rounded-field border px-3 py-3 text-left transition-colors ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-base-300 bg-base-100 hover:bg-base-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-base-content">
                {template.name}
              </span>
              {template.linkedFormName && (
                <span className="rounded-full bg-base-200 px-2 py-0.5 text-[10px] font-medium text-base-content/60">
                  {template.linkedFormName}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
