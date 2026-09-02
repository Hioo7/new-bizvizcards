import { useLocation, Navigate } from "react-router-dom";
import AuthLayout from "@layouts/AuthLayout";
import { OAuthAuthorizeView } from "@features/oauth-authorize";
import { useAuth } from "@hooks/useAuth";
import { ROUTES, REDIRECT_QUERY_PARAM } from "@config/routes";

// A standalone route (not behind RequireAuth) because RequireAuth hard-
// redirects to /login without preserving the original URL — this page needs
// the customer to land back here, with the OAuth request's signed query
// string intact, right after signing in.
export default function OAuthAuthorizePage() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`${ROUTES.login}?${REDIRECT_QUERY_PARAM}=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return (
    <AuthLayout
      promoHeading={
        <>
          Connect Your
          <br />
          AI Assistant
        </>
      }
      promoSubtext="Let ChatGPT or Claude help you manage leads, notes, and reminders — securely, with your permission."
    >
      <OAuthAuthorizeView />
    </AuthLayout>
  );
}
