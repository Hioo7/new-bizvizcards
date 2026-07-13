import type { LucideIcon } from "lucide-react";

interface EmptyStepStateProps {
  icon: LucideIcon;
  message: string;
}

export default function EmptyStepState({ icon: Icon, message }: EmptyStepStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-field border border-dashed border-base-300 px-4 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-base-200 text-base-content/30">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-base-content/50">{message}</p>
    </div>
  );
}
