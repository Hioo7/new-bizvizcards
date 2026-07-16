import { useSmartCardTemplates } from "@features/plans/hooks/useSmartCardTemplates";

interface SmartCardTemplateWhitelistPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function SmartCardTemplateWhitelistPicker({
  value,
  onChange,
}: SmartCardTemplateWhitelistPickerProps) {
  const { templates, isLoading, error } = useSmartCardTemplates();

  function toggle(templateId: string) {
    onChange(
      value.includes(templateId)
        ? value.filter((id) => id !== templateId)
        : [...value, templateId],
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <span className="loading loading-spinner loading-sm text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-error">{error}</p>;
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-base-content/60">
        No smart card templates exist yet.
      </p>
    );
  }

  return (
    <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-field border border-base-300 bg-base-200 p-2">
      {templates.map((template) => (
        <label
          key={template.id}
          className="flex min-h-11 items-center justify-between gap-3 rounded-field px-2 py-1.5 hover:bg-base-300/50"
        >
          <span className="text-sm text-base-content">{template.name}</span>
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={value.includes(template.id)}
            onChange={() => toggle(template.id)}
            aria-label={`Whitelist ${template.name}`}
          />
        </label>
      ))}
    </div>
  );
}
