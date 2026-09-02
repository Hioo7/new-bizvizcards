import { ShieldCheck, AlertTriangle } from "lucide-react";
import { useOAuthAuthorize } from "@features/oauth-authorize/hooks/useOAuthAuthorize";

export default function OAuthAuthorizeView() {
  const { status, client, error, approve, deny } = useOAuthAuthorize();

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm text-base-content/60">Loading request…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertTriangle className="h-10 w-10 text-error" />
        <h1 className="text-xl font-bold text-base-content">
          Can&rsquo;t complete this request
        </h1>
        <p className="text-sm text-base-content/60">{error}</p>
      </div>
    );
  }

  const isSubmitting = status === "submitting";

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h1 className="mb-1 text-xl font-bold text-base-content sm:text-2xl">
          {client?.client_name ?? "This app"} wants to connect
        </h1>
        <p className="text-sm text-base-content/60">
          It will be able to view and manage your leads, notes, and reminders.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void approve()}
          className="btn min-h-11 w-full rounded-field border-none bg-primary text-sm font-semibold text-primary-content shadow-md hover:bg-primary/90 disabled:bg-base-300"
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Allow access"
          )}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void deny()}
          className="btn min-h-11 w-full rounded-field border border-base-300 bg-base-100 text-sm font-semibold text-base-content hover:bg-base-200"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
