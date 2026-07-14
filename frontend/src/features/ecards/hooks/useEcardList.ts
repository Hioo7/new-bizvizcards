import { useCallback, useEffect, useState } from "react";
import { listEcards } from "@services/ecardService";
import type { Ecard } from "@app-types/ecard";
import { ECARD_LIST_PAGE_SIZE } from "@features/ecards/config/ecardBuilder.config";

export interface UseEcardListResult {
  ecards: Ecard[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEcardList(customerId: string): UseEcardListResult {
  const [ecards, setEcards] = useState<Ecard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listEcards({
          customerId,
          page: 1,
          pageSize: ECARD_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setEcards(response.ecards);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load e-cards.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [customerId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { ecards, isLoading, error, refetch };
}
