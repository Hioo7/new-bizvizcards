import { useEffect, useState } from "react";
import { getEffectivePolicy } from "@services/planService";
import type { EffectivePolicy } from "@app-types/plan";

export interface UseMyEffectivePolicyResult {
  policy: EffectivePolicy | null;
  isLoading: boolean;
  error: string | null;
}

export function useMyEffectivePolicy(): UseMyEffectivePolicyResult {
  const [policy, setPolicy] = useState<EffectivePolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPolicy() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getEffectivePolicy();
        if (!cancelled) setPolicy(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load plan policy.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchPolicy();

    return () => {
      cancelled = true;
    };
  }, []);

  return { policy, isLoading, error };
}
