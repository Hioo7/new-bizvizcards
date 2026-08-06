import type { LucideIcon } from "lucide-react";

interface CustomerStatBadgeProps {
  icon: LucideIcon;
  value: number;
  label: string;
}

export default function CustomerStatBadge({
  icon: Icon,
  value,
  label,
}: CustomerStatBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm text-base-content/70"
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5 text-base-content/40" aria-hidden="true" />
      {value.toLocaleString()}
    </span>
  );
}
