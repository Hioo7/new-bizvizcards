import { ArrowLeft, AlertTriangle, PlugZap, Trash2 } from "lucide-react";
import { useConnectedApps } from "@features/connected-apps/hooks/useConnectedApps";

interface ConnectedAppsViewProps {
  onBack?: () => void;
}

export default function ConnectedAppsView({ onBack }: ConnectedAppsViewProps) {
  const { apps, isLoading, error, revokingId, revoke } = useConnectedApps();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-base-content">
            Connected AI Apps
          </h1>
          <p className="text-sm text-base-content/60">
            AI apps like ChatGPT and Claude that can view and manage your
            leads, notes, and reminders.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-error" />
          <p className="text-sm text-base-content/60">{error}</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <PlugZap className="h-8 w-8 text-base-content/30" />
          <p className="text-sm text-base-content/60">
            No AI apps connected yet. Connect ChatGPT or Claude from within
            that app to get started.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {apps.map((app) => (
            <li
              key={app.consentId}
              className="flex items-center justify-between gap-4 rounded-box border border-base-300 bg-base-100 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-base-content">
                  {app.clientName}
                </p>
                <p className="text-xs text-base-content/50">
                  Connected {new Date(app.connectedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Revoke access for ${app.clientName}`}
                disabled={revokingId === app.consentId}
                onClick={() => void revoke(app.consentId)}
                className="btn btn-square btn-ghost min-h-11 min-w-11 text-error"
              >
                {revokingId === app.consentId ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
