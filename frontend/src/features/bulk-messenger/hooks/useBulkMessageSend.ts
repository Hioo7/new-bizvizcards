import { useCallback, useEffect, useState } from "react";
import type { BulkMessageSendDetail } from "@app-types/bulkMessenger";
import { getBulkMessageSend } from "@services/bulkMessengerService";

export interface UseBulkMessageSendResult {
  send: BulkMessageSendDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBulkMessageSend(
  sendId: string | undefined,
): UseBulkMessageSendResult {
  const [send, setSend] = useState<BulkMessageSendDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!sendId) {
        setError("Send not found.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await getBulkMessageSend(sendId);
        if (cancelled) return;
        setSend(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load send.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [sendId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { send, isLoading, error, refetch };
}
