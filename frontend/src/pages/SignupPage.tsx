import { useSearchParams } from "react-router-dom";
import AuthLayout from "@layouts/AuthLayout";
import { SignupForm } from "@features/auth";
import { useInviteLookup } from "@features/organisation-invite/hooks/useInviteLookup";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import { ROUTES, INVITE_TOKEN_QUERY_PARAM } from "@config/routes";

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get(INVITE_TOKEN_QUERY_PARAM);

  return (
    <AuthLayout
      promoHeading={
        <>
          Professional Networking
          <br />
          Starts Here
        </>
      }
      promoSubtext="Create your account to securely manage your digital identity and business connections."
    >
      {inviteToken ? (
        <InviteAwareSignupForm token={inviteToken} />
      ) : (
        <SignupForm />
      )}
    </AuthLayout>
  );
}

function InviteAwareSignupForm({ token }: { token: string }) {
  const { lookup, isLoading } = useInviteLookup(token);

  if (isLoading) {
    return <span className="loading loading-spinner loading-lg text-primary" />;
  }

  // Invite is invalid/expired/disabled — fall back to a plain signup rather
  // than blocking account creation on a broken invite link.
  if (!lookup || lookup.status !== "PENDING" || !lookup.emailFlowEnabled) {
    return <SignupForm />;
  }

  return (
    <SignupForm
      lockedEmail={lookup.email}
      redirectTo={ROUTES.orgDashboard}
      onAfterSignup={async () => {
        await userDashboardService.acceptOrgInvite(token);
      }}
    />
  );
}
