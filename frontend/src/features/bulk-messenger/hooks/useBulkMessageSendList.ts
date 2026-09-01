import { useCallback, useEffect, useState } from "react";
import type { BulkMessageSendSummary } from "@app-types/bulkMessenger";
import { listBulkMessageSends } from "@services/bulkMessengerService";

export interface UseBulkMessageSendListResult {
  sends: BulkMessageSendSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBulkMessageSendList(): UseBulkMessageSendListResult {
  const [sends, setSends] = useState<BulkMessageSendSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listBulkMessageSends();
        if (cancelled) return;
        setSends(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load sends.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { sends, isLoading, error, refetch };
}
