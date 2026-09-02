import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getOAuthPublicClient, submitOAuthConsent } from "@services/authService";
import type { OAuthPublicClient } from "@app-types/auth";

export type OAuthAuthorizeStatus = "loading" | "error" | "ready" | "submitting";

export interface UseOAuthAuthorizeResult {
  status: OAuthAuthorizeStatus;
  client: OAuthPublicClient | null;
  error: string | null;
  approve: () => Promise<void>;
  deny: () => Promise<void>;
}

export function useOAuthAuthorize(): UseOAuthAuthorizeResult {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client_id");
  // The exact, unmodified query string this page loaded with — better-auth
  // signed it when redirecting here from /oauth2/authorize, and re-verifies
  // that signature when this is echoed back to /oauth2/consent. Must be
  // captured as-is, not reconstructed from individual params.
  const oauthQuery = searchParams.toString();

  const [status, setStatus] = useState<OAuthAuthorizeStatus>("loading");
  const [client, setClient] = useState<OAuthPublicClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClient() {
      if (!clientId) {
        if (!cancelled) {
          setError("This authorization link is missing required information.");
          setStatus("error");
        }
        return;
      }

      try {
        const result = await getOAuthPublicClient(clientId);
        if (!cancelled) {
          setClient(result);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load this request.",
          );
          setStatus("error");
        }
      }
    }

    void loadClient();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function decide(accept: boolean) {
    setStatus("submitting");
    try {
      // Navigates the browser away to the requesting app's redirect_uri on
      // success — there is no further local state to reach afterward.
      await submitOAuthConsent({ accept, oauthQuery });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit your decision.",
      );
      setStatus("error");
    }
  }

  return {
    status,
    client,
    error,
    approve: () => decide(true),
    deny: () => decide(false),
  };
}
