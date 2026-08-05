import type { LucideIcon } from "lucide-react";

interface LockedFeaturePanelProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

// Whole-panel-locked state for a plan-gated feature — same visual family as
// OrgDashboardCard.tsx's "Organisation not available on your plan" panel,
// generalized with icon/title/subtitle props so it can be reused for any
// locked org-dashboard feature.
export default function LockedFeaturePanel({
  icon: Icon,
  title,
  subtitle,
}: LockedFeaturePanelProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 py-10 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-200">
        <Icon className="h-6 w-6 text-base-content/30" strokeWidth={1.6} />
      </div>
      <div>
        <p className="text-xs font-semibold text-base-content/60">{title}</p>
        <p className="mt-0.5 text-xs text-base-content/40">{subtitle}</p>
      </div>
    </div>
  );
}
