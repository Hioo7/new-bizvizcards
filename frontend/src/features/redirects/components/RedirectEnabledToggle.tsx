interface RedirectEnabledToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export default function RedirectEnabledToggle({
  enabled,
  disabled,
  onToggle,
}: RedirectEnabledToggleProps) {
  return (
    <label className="flex min-h-11 items-center gap-2">
      <input
        type="checkbox"
        className="toggle toggle-success"
        checked={enabled}
        disabled={disabled}
        onChange={onToggle}
        aria-label={enabled ? "Disable redirect" : "Enable redirect"}
      />
      <span className="text-xs font-semibold text-base-content/60">
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </label>
  );
}
