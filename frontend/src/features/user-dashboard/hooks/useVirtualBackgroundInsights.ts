import { useEffect, useState } from "react";
import { getVirtualBackgroundAnalytics } from "@services/virtualBackgroundService";
import type { VirtualBackgroundAnalytics } from "@app-types/virtualBackground";

interface UseVirtualBackgroundInsightsResult {
  data: VirtualBackgroundAnalytics | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads the customer's virtual-background scan analytics (default 30-day
 * window). Fetches only when `enabled` — the caller gates it on the plan
 * actually including virtual backgrounds.
 */
export function useVirtualBackgroundInsights(
  enabled: boolean,
): UseVirtualBackgroundInsightsResult {
  const [data, setData] = useState<VirtualBackgroundAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getVirtualBackgroundAnalytics();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load virtual background analytics",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, loading, error };
}
