import { useCallback, useEffect, useState } from "react";
import { listExternalRedirects } from "@services/redirectService";
import type { ExternalRedirect } from "@features/redirects/types/redirects.types";

export interface UseExternalRedirectsResult {
  redirects: ExternalRedirect[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExternalRedirects(): UseExternalRedirectsResult {
  const [redirects, setRedirects] = useState<ExternalRedirect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchRedirects() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listExternalRedirects();
        if (cancelled) return;
        setRedirects(response);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load external redirects.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchRedirects();

    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { redirects, isLoading, error, refetch };
}
