import { useMemo } from "react";
import {
  assignPlan,
  cancelCustomerPlan,
  renewCustomerPlan,
  switchCustomerPlan,
} from "@services/planService";

export interface UseCustomerPlanMutationsResult {
  assign: (customerId: string, planId: string) => Promise<void>;
  switchPlan: (customerId: string, planId: string) => Promise<void>;
  renew: (customerId: string) => Promise<void>;
  cancel: (customerId: string) => Promise<void>;
}

export function useCustomerPlanMutations(
  refetch: () => void,
): UseCustomerPlanMutationsResult {
  return useMemo(
    () => ({
      assign: async (customerId, planId) => {
        await assignPlan(customerId, planId);
        refetch();
      },
      switchPlan: async (customerId, planId) => {
        await switchCustomerPlan(customerId, planId);
        refetch();
      },
      renew: async (customerId) => {
        await renewCustomerPlan(customerId);
        refetch();
      },
      cancel: async (customerId) => {
        await cancelCustomerPlan(customerId);
        refetch();
      },
    }),
    [refetch],
  );
}
