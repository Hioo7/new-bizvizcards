import { useCallback, useEffect, useState } from "react";
import { listRestrictedPaths } from "@services/redirectService";
import type { RestrictedPath } from "@features/redirects/types/redirects.types";

export interface UseRestrictedPathsResult {
  restrictedPaths: RestrictedPath[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRestrictedPaths(): UseRestrictedPathsResult {
  const [restrictedPaths, setRestrictedPaths] = useState<RestrictedPath[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchRestrictedPaths() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listRestrictedPaths();
        if (cancelled) return;
        setRestrictedPaths(response);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load restricted paths.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchRestrictedPaths();

    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { restrictedPaths, isLoading, error, refetch };
}
