import { useEffect, useState } from "react";
import { getPublicEcard } from "@services/publicEcardService";
import type { Ecard } from "@app-types/ecard";

export interface UsePublicEcardResult {
  card: Ecard | null;
  isLoading: boolean;
  error: string | null;
}

export function usePublicEcard(endpoint: string | undefined): UsePublicEcardResult {
  const [card, setCard] = useState<Ecard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint) return;
    let cancelled = false;

    async function fetchCard() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getPublicEcard(endpoint as string);
        if (!cancelled) setCard(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "E-card not found.");
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
