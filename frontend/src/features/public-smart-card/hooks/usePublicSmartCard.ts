import { useEffect, useState } from "react";
import { getPublicSmartCard } from "@services/publicSmartCardService";
import type { PublicSmartCard } from "@app-types/smartCard";

export interface UsePublicSmartCardResult {
  card: PublicSmartCard | null;
  isLoading: boolean;
  error: string | null;
}

export function usePublicSmartCard(endpoint: string | undefined): UsePublicSmartCardResult {
  const [card, setCard] = useState<PublicSmartCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint) return;
    let cancelled = false;

    async function fetchCard() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getPublicSmartCard(endpoint as string);
        if (!cancelled) setCard(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Smart card not found.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchCard();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return { card, isLoading, error };
}
