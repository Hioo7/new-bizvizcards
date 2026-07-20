import { RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import { useMigrationPreflight } from "../hooks/useMigrationPreflight";
import MigrationPreflightItem from "./MigrationPreflightItem";

export default function MigrationPreflightChecklist() {
  const { summary, isLoading, error, recheck } = useMigrationPreflight();

  return (
    <div className="flex flex-col gap-4 rounded-field border border-base-300 bg-base-100 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {summary?.canStart ? (
            <ShieldCheck className="h-5 w-5 text-success" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-warning" />
          )}
          <h2 className="text-base font-bold text-base-content">
            Pre-flight checks
          </h2>
        </div>
        <button
          type="button"
          onClick={recheck}
          disabled={isLoading}
          className="btn btn-sm min-h-11 gap-2 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Recheck now
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-field bg-error/10 px-3 py-2 text-sm text-error">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!summary && isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {summary?.checks.map((check) => (
            <MigrationPreflightItem key={check.id} check={check} />
          ))}
        </ul>
      )}

      {summary && !summary.canStart && (
        <p className="text-xs text-base-content/60">
          This checklist rechecks itself automatically — fix the items above
          and they will turn green on their own.
        </p>
      )}
    </div>
  );
}
