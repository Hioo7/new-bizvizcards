import { useVirtualBackgroundTemplates } from "@features/plans/hooks/useVirtualBackgroundTemplates";

interface VirtualBackgroundTemplateWhitelistPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function VirtualBackgroundTemplateWhitelistPicker({
  value,
  onChange,
}: VirtualBackgroundTemplateWhitelistPickerProps) {
  const { templates, isLoading, error } = useVirtualBackgroundTemplates();

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
        No virtual background templates exist yet.
      </p>
    );
  }

  return (
    <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto rounded-field border border-base-300 bg-base-200 p-2 sm:grid-cols-3">
      {templates.map((template) => {
        const isChecked = value.includes(template.id);
        return (
          <label
            key={template.id}
            className={`relative flex cursor-pointer flex-col overflow-hidden rounded-field border-2 ${
              isChecked ? "border-primary" : "border-transparent"
            }`}
          >
            <img
              src={template.imageUrl}
              alt={template.name}
              className="aspect-video w-full object-cover"
            />
            <span className="truncate bg-base-100 px-2 py-1 text-xs font-medium text-base-content">
              {template.name}
            </span>
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm absolute right-1.5 top-1.5 bg-base-100"
              checked={isChecked}
              onChange={() => toggle(template.id)}
              aria-label={`Whitelist ${template.name}`}
            />
          </label>
        );
      })}
    </div>
  );
}
