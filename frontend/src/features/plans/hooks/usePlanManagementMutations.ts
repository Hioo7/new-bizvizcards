import { useMemo } from "react";
import {
  bulkAssignCustomersToPlan,
  createPlan,
  deletePlan,
  setFallbackPlan,
  updatePlan,
} from "@services/planService";
import type {
  BulkAssignCustomersToPlanResult,
  CreatePlanPayload,
  PlanDetail,
  UpdatePlanPayload,
} from "@app-types/plan";

export interface UsePlanManagementMutationsResult {
  createPlan: (payload: CreatePlanPayload) => Promise<PlanDetail>;
  updatePlan: (id: string, payload: UpdatePlanPayload) => Promise<PlanDetail>;
  setFallbackPlan: (id: string) => Promise<PlanDetail>;
  deletePlan: (id: string) => Promise<void>;
  bulkAssignCustomers: (
    planId: string,
    customerIds: string[],
  ) => Promise<BulkAssignCustomersToPlanResult>;
}

export function usePlanManagementMutations(
  refetch: () => void,
): UsePlanManagementMutationsResult {
  return useMemo(
    () => ({
      createPlan: async (payload) => {
        const result = await createPlan(payload);
        refetch();
        return result;
      },
      updatePlan: async (id, payload) => {
        const result = await updatePlan(id, payload);
        refetch();
        return result;
      },
      setFallbackPlan: async (id) => {
        const result = await setFallbackPlan(id);
        refetch();
        return result;
      },
      deletePlan: async (id) => {
        await deletePlan(id);
        refetch();
      },
      // No refetch — linking customers to a plan doesn't change any plan
      // summary field the list displays.
      bulkAssignCustomers: (planId, customerIds) =>
        bulkAssignCustomersToPlan(planId, customerIds),
    }),
    [refetch],
  );
}
