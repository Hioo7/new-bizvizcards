import { useCallback, useEffect, useState } from "react";
import {
  getOAuthConsents,
  getOAuthPublicClient,
  revokeOAuthConsent,
} from "@services/authService";
import type { OAuthConsent } from "@app-types/auth";

export interface ConnectedApp {
  consentId: string;
  clientId: string;
  clientName: string;
  connectedAt: string;
}

export interface UseConnectedAppsResult {
  apps: ConnectedApp[];
  isLoading: boolean;
  error: string | null;
  revokingId: string | null;
  revoke: (consentId: string) => Promise<void>;
}

// GET /oauth2/get-consents returns each grant's clientId but not the app's
// display name — one GET /oauth2/public-client call per distinct client
// fills that in. The list of connected apps is normally small (a handful),
// so this fan-out stays cheap.
async function toConnectedApp(consent: OAuthConsent): Promise<ConnectedApp> {
  const client = await getOAuthPublicClient(consent.clientId);
  return {
    consentId: consent.id,
    clientId: consent.clientId,
    clientName: client.client_name,
    connectedAt: consent.createdAt,
  };
}

export function useConnectedApps(): UseConnectedAppsResult {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const consents = await getOAuthConsents();
        const resolved = await Promise.all(consents.map(toConnectedApp));
        setApps(resolved);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load connected apps.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  const revoke = useCallback(async (consentId: string) => {
    setRevokingId(consentId);
    try {
      await revokeOAuthConsent(consentId);
      setApps((prev) => prev.filter((app) => app.consentId !== consentId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke access.",
      );
    } finally {
      setRevokingId(null);
    }
  }, []);

  return { apps, isLoading, error, revokingId, revoke };
}
