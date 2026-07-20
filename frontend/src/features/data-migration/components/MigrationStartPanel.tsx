import { PlayCircle } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";

interface MigrationStartPanelProps {
  canStart: boolean;
  isStarting: boolean;
  startError: string | null;
  onStart: () => void;
}

export default function MigrationStartPanel({
  canStart,
  isStarting,
  startError,
  onStart,
}: MigrationStartPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-field border border-base-300 bg-base-100 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-base-content">
            Run migration
          </h2>
          <p className="text-sm text-base-content/60">
            Migrates every legacy record not already migrated — safe to run
            more than once.
          </p>
        </div>
        <div
          className={!canStart ? "tooltip tooltip-left" : undefined}
          data-tip={
            !canStart
              ? "All pre-flight checks must pass before starting"
              : undefined
          }
        >
          <button
            type="button"
            disabled={!canStart || isStarting}
            onClick={onStart}
            className="btn btn-primary min-h-11 gap-2 rounded-field disabled:opacity-50"
          >
            {isStarting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <PlayCircle className="h-5 w-5" />
            )}
            Start migration
          </button>
        </div>
      </div>
      <FormErrorRibbon message={startError} />
    </div>
  );
}
