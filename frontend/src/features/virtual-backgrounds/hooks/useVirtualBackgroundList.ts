import { useCallback, useEffect, useState } from "react";
import { listVirtualBackgrounds } from "@services/virtualBackgroundService";
import type { VirtualBackgroundSummary } from "@app-types/virtualBackground";

export interface UseVirtualBackgroundListResult {
  virtualBackgrounds: VirtualBackgroundSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVirtualBackgroundList(): UseVirtualBackgroundListResult {
  const [virtualBackgrounds, setVirtualBackgrounds] = useState<
    VirtualBackgroundSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listVirtualBackgrounds();
        if (cancelled) return;
        setVirtualBackgrounds(result);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load virtual backgrounds.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { virtualBackgrounds, isLoading, error, refetch };
}
