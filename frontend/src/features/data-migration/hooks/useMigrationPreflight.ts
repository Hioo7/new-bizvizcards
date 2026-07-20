import { useCallback, useEffect, useState } from "react";
import { getPreflightSummary } from "../services/dataMigrationService";
import type { MigrationPreflightSummary } from "../types";
import { PREFLIGHT_POLL_INTERVAL_MS } from "../config";

export interface UseMigrationPreflightResult {
  summary: MigrationPreflightSummary | null;
  isLoading: boolean;
  error: string | null;
  recheck: () => void;
}

/** Polls GET /api/migration/preflight on an interval while any check is
 * still failing, so fixing the tunnel/staging bucket elsewhere flips the
 * row green without the admin needing to know to click anything — stops
 * polling once every check passes. Uses a chained setTimeout rather than
 * setInterval so a slow check never overlaps with the next one. */
export function useMigrationPreflight(): UseMigrationPreflightResult {
  const [summary, setSummary] = useState<MigrationPreflightSummary | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      setIsLoading(true);
      try {
        const result = await getPreflightSummary();
        if (cancelled) return;
        setSummary(result);
        setError(null);
        if (!result.canStart) {
          timeoutId = setTimeout(() => void check(), PREFLIGHT_POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to check migration prerequisites.",
        );
        timeoutId = setTimeout(() => void check(), PREFLIGHT_POLL_INTERVAL_MS);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void check();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [refetchToken]);

  const recheck = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { summary, isLoading, error, recheck };
}
