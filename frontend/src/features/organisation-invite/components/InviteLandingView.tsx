import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, LogOut, XCircle } from "lucide-react";
import { ROUTES, INVITE_TOKEN_QUERY_PARAM } from "@config/routes";
import { useAuth } from "@hooks/useAuth";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import { useInviteLookup } from "@features/organisation-invite/hooks/useInviteLookup";

interface InviteLandingViewProps {
  token: string;
}

const INVALID_STATUS_MESSAGE: Record<string, string> = {
  EXPIRED: "This invite has expired. Ask your organisation admin to send a new one.",
  REVOKED: "This invite has been revoked.",
  ACCEPTED: "This invite has already been used.",
  RESOLVED: "This invite has already been used.",
};

export default function InviteLandingView({ token }: InviteLandingViewProps) {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const { lookup, isLoading: isLookupLoading, error: lookupError } =
    useInviteLookup(token);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [hasAttemptedAccept, setHasAttemptedAccept] = useState(false);

  const isMatchingAccount =
    lookup !== null &&
    user !== null &&
    user.email.toLowerCase() === lookup.email.toLowerCase();

  useEffect(() => {
    if (
      !lookup ||
      lookup.status !== "PENDING" ||
      !lookup.emailFlowEnabled ||
      !isMatchingAccount ||
      hasAttemptedAccept
    ) {
      return;
    }

    async function accept() {
      setHasAttemptedAccept(true);
      setIsAccepting(true);
      try {
        await userDashboardService.acceptOrgInvite(token);
        navigate(ROUTES.orgDashboard);
      } catch (err) {
        setAcceptError(
          err instanceof Error ? err.message : "Failed to accept this invite.",
        );
      } finally {
        setIsAccepting(false);
      }
    }

    void accept();
  }, [lookup, isMatchingAccount, hasAttemptedAccept, token, navigate]);

  const returnUrl = `${ROUTES.login}?${INVITE_TOKEN_QUERY_PARAM}=${encodeURIComponent(token)}`;
  const signupUrl = `${ROUTES.signup}?${INVITE_TOKEN_QUERY_PARAM}=${encodeURIComponent(token)}`;

  if (isAuthLoading || isLookupLoading) {
    return <StatusPanel icon="loading" message="Checking your invite…" />;
  }

  if (lookupError || !lookup) {
    return (
      <StatusPanel
        icon={XCircle}
        message="This invite link is invalid or has expired."
      />
    );
  }

  if (lookup.status !== "PENDING") {
    return (
      <StatusPanel
        icon={XCircle}
        message={
          INVALID_STATUS_MESSAGE[lookup.status] ??
          "This invite is no longer valid."
        }
      />
    );
  }

  if (!lookup.emailFlowEnabled) {
    return (
      <StatusPanel
        icon={Building2}
        tone="primary"
        message={`Self-serve joining isn't available yet — ask an admin at ${lookup.organisationName} to add you directly.`}
      />
    );
  }

  if (acceptError) {
    return <StatusPanel icon={XCircle} message={acceptError} />;
  }

  if (user && !isMatchingAccount) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <IconBadge icon={XCircle} tone="error" />
        <p className="text-sm text-base-content/70">
          You&rsquo;re signed in as <strong>{user.email}</strong>, but this
          invite was sent to <strong>{lookup.email}</strong>. Log out and sign
          in with the right account to continue.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    );
  }

  if (isAccepting) {
    return <StatusPanel icon="loading" message="Joining the organisation…" />;
  }

  if (isMatchingAccount) {
    return <StatusPanel icon="loading" message="Joining the organisation…" />;
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <IconBadge icon={Building2} tone="primary" />
      <div>
        <h1 className="text-xl font-bold text-base-content">
          Join {lookup.organisationName}
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          You&rsquo;ve been invited as <strong>{lookup.email}</strong>
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={() => navigate(signupUrl)}
          className="btn min-h-11 rounded-field bg-primary text-sm font-semibold text-primary-content hover:bg-primary/90"
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => navigate(returnUrl)}
          className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-sm font-semibold text-base-content hover:bg-base-200"
        >
          Log in
        </button>
      </div>
    </div>
  );
}

function IconBadge({
  icon: Icon,
  tone,
}: {
  icon: typeof Building2;
  tone: "primary" | "error" | "success";
}) {
  const toneClass =
    tone === "error"
      ? "bg-error/10 text-error"
      : tone === "success"
        ? "bg-success/10 text-success"
        : "bg-primary/10 text-primary";
  return (
    <span
      className={`flex h-14 w-14 items-center justify-center rounded-full ${toneClass}`}
    >
      <Icon className="h-6 w-6" />
    </span>
  );
}

function StatusPanel({
  icon,
  tone = "error",
  message,
}: {
  icon: typeof Building2 | "loading";
  tone?: "primary" | "error" | "success";
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      {icon === "loading" ? (
        <span className="loading loading-spinner loading-lg text-primary" />
      ) : (
        <IconBadge icon={icon} tone={tone} />
      )}
      <p className="text-sm text-base-content/70">{message}</p>
    </div>
  );
}
