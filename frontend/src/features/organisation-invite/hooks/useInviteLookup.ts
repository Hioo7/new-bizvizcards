import { useEffect, useState } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type { OrgInviteLookup } from "@features/user-dashboard/types";

export interface UseInviteLookupResult {
  lookup: OrgInviteLookup | null;
  isLoading: boolean;
  error: string | null;
}

export function useInviteLookup(token: string): UseInviteLookupResult {
  const [lookup, setLookup] = useState<OrgInviteLookup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await userDashboardService.lookupOrgInvite(token);
        if (!cancelled) setLookup(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "This invite link is invalid or has expired.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { lookup, isLoading, error };
}
