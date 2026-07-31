import { useSearchParams } from "react-router-dom";
import AuthLayout from "@layouts/AuthLayout";
import { LoginForm } from "@features/auth";
import { useInviteLookup } from "@features/organisation-invite/hooks/useInviteLookup";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import { ROUTES, INVITE_TOKEN_QUERY_PARAM } from "@config/routes";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get(INVITE_TOKEN_QUERY_PARAM);

  return (
    <AuthLayout
      promoHeading={
        <>
          Smart Digital
          <br />
          Business Cards
        </>
      }
      promoSubtext="A modern platform for managing professional profiles, contact sharing, and business networking."
    >
      {inviteToken ? <InviteAwareLoginForm token={inviteToken} /> : <LoginForm />}
    </AuthLayout>
  );
}

function InviteAwareLoginForm({ token }: { token: string }) {
  const { lookup, isLoading } = useInviteLookup(token);

  if (isLoading) {
    return <span className="loading loading-spinner loading-lg text-primary" />;
  }

  if (!lookup || lookup.status !== "PENDING" || !lookup.emailFlowEnabled) {
    return <LoginForm />;
  }

  return (
    <LoginForm
      prefillEmail={lookup.email}
      redirectTo={ROUTES.orgDashboard}
      onAfterSignIn={async () => {
        await userDashboardService.acceptOrgInvite(token);
      }}
    />
  );
}
