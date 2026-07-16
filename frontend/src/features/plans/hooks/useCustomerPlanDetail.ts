import { useCallback, useEffect, useState } from "react";
import { getCustomerEffectivePolicy, getPlan, listCustomerPlanHistory } from "@services/planService";
import type { PlanPurchaseHistoryEntry } from "@app-types/plan";

export interface CustomerPlanStatus {
  planId: string;
  planName: string;
  isFallback: boolean;
}

export interface UseCustomerPlanDetailResult {
  status: CustomerPlanStatus | null;
  history: PlanPurchaseHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCustomerPlanDetail(
  customerId: string | null,
): UseCustomerPlanDetailResult {
  const [status, setStatus] = useState<CustomerPlanStatus | null>(null);
  const [history, setHistory] = useState<PlanPurchaseHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;

    async function fetchDetail() {
      if (!customerId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [effectivePolicy, historyEntries] = await Promise.all([
          getCustomerEffectivePolicy(customerId),
          listCustomerPlanHistory(customerId),
        ]);
        const plan = await getPlan(effectivePolicy.planId);
        if (cancelled) return;
        setStatus({
          planId: effectivePolicy.planId,
          planName: plan.name,
          isFallback: effectivePolicy.isFallback,
        });
        setHistory(historyEntries);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load plan status.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [customerId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { status, history, isLoading, error, refetch };
}
