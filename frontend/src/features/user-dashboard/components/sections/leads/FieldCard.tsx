import type { ReactNode } from "react";

interface FieldCardProps {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  empty?: string;
}

export default function FieldCard({ icon, label, value, empty = "Not added" }: FieldCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 shadow-sm">
      <span className="shrink-0 text-base-content/40">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-base-content/50">{label}</p>
        {value ? (
          <p className="text-sm font-medium text-base-content break-all">{value}</p>
        ) : (
          <p className="text-sm italic text-base-content/40">{empty}</p>
        )}
      </div>
    </div>
  );
}
