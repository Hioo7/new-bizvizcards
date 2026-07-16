import { useEffect, useState } from "react";
import { getCustomerEffectivePolicy } from "@services/planService";
import type { EffectivePolicy } from "@app-types/plan";

export interface UseCustomerEffectivePolicyResult {
  policy: EffectivePolicy | null;
  isLoading: boolean;
  error: string | null;
}

// Employee-facing surfaces (e.g. the e-card builder) act on a customer's
// data, but plan enforcement is always the customer's own — this resolves
// that customer's effective policy so the UI can proactively hide what the
// backend would reject anyway.
export function useCustomerEffectivePolicy(
  customerId: string | null,
): UseCustomerEffectivePolicyResult {
  const [policy, setPolicy] = useState<EffectivePolicy | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;

    async function fetchPolicy() {
      if (!customerId) return;
      setIsFetching(true);
      setError(null);
      try {
        const result = await getCustomerEffectivePolicy(customerId);
        if (!cancelled) setPolicy(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load plan policy.",
          );
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    void fetchPolicy();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return { policy, isLoading: Boolean(customerId) && isFetching, error };
}
