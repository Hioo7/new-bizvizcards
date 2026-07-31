import { useParams } from "react-router-dom";
import AuthLayout from "@layouts/AuthLayout";
import { InviteLandingView } from "@features/organisation-invite";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();

  return (
    <AuthLayout
      promoHeading={
        <>
          You&rsquo;ve Been
          <br />
          Invited
        </>
      }
      promoSubtext="Join your organisation's team on BizVizCards to share a consistent, branded digital identity."
    >
      {token ? (
        <InviteLandingView token={token} />
      ) : (
        <p className="text-sm text-base-content/60">Missing invite token.</p>
      )}
    </AuthLayout>
  );
}
