import { useEffect, useState } from "react";
import { listCustomerEcards } from "@services/customerEcardService";
import type { Ecard } from "@app-types/ecard";

export interface UseCustomerEcardsForVirtualBackgroundResult {
  ecards: Ecard[];
  isLoading: boolean;
  error: string | null;
}

export function useCustomerEcardsForVirtualBackground(): UseCustomerEcardsForVirtualBackgroundResult {
  const [ecards, setEcards] = useState<Ecard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listCustomerEcards();
        if (!cancelled) setEcards(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load e-cards.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ecards, isLoading, error };
}
