import {
  CUSTOMER_PLAN_BASE_PATH,
  EMPLOYEE_CUSTOMER_PLAN_BASE_PATH,
  EMPLOYEE_PLANS_BASE_PATH,
} from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  CreatePlanPayload,
  EffectivePolicy,
  ListPlansQuery,
  PlanDetail,
  PlanListResponse,
  PlanPurchaseHistoryEntry,
  UpdatePlanPayload,
} from "@app-types/plan";

export function listPlans(query: ListPlansQuery): Promise<PlanListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set("search", query.search);

  return apiRequest<PlanListResponse>(
    `${EMPLOYEE_PLANS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function getPlan(id: string): Promise<PlanDetail> {
  return apiRequest<PlanDetail>(`${EMPLOYEE_PLANS_BASE_PATH}/${id}`, {
    method: "GET",
  });
}

export function createPlan(payload: CreatePlanPayload): Promise<PlanDetail> {
  return apiRequest<PlanDetail>(EMPLOYEE_PLANS_BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePlan(
  id: string,
  payload: UpdatePlanPayload,
): Promise<PlanDetail> {
  return apiRequest<PlanDetail>(`${EMPLOYEE_PLANS_BASE_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setFallbackPlan(id: string): Promise<PlanDetail> {
  return apiRequest<PlanDetail>(`${EMPLOYEE_PLANS_BASE_PATH}/${id}/fallback`, {
    method: "PATCH",
  });
}

export function deletePlan(id: string): Promise<void> {
  return apiRequest<void>(`${EMPLOYEE_PLANS_BASE_PATH}/${id}`, {
    method: "DELETE",
  });
}

export function assignPlan(
  customerId: string,
  planId: string,
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_CUSTOMER_PLAN_BASE_PATH}/${customerId}/plan/assign`,
    { method: "POST", body: JSON.stringify({ planId }) },
  );
}

export function switchCustomerPlan(
  customerId: string,
  planId: string,
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_CUSTOMER_PLAN_BASE_PATH}/${customerId}/plan/switch`,
    { method: "POST", body: JSON.stringify({ planId }) },
  );
}

export function renewCustomerPlan(customerId: string): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_CUSTOMER_PLAN_BASE_PATH}/${customerId}/plan/renew`,
    { method: "POST" },
  );
}

export function cancelCustomerPlan(customerId: string): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_CUSTOMER_PLAN_BASE_PATH}/${customerId}/plan/cancel`,
    { method: "POST" },
  );
}

export function listCustomerPlanHistory(
  customerId: string,
): Promise<PlanPurchaseHistoryEntry[]> {
  return apiRequest<PlanPurchaseHistoryEntry[]>(
    `${EMPLOYEE_CUSTOMER_PLAN_BASE_PATH}/${customerId}/plan/history`,
    { method: "GET" },
  );
}

export function getEffectivePolicy(): Promise<EffectivePolicy> {
  return apiRequest<EffectivePolicy>(
    `${CUSTOMER_PLAN_BASE_PATH}/effective-policy`,
    { method: "GET" },
  );
}

export function getCustomerEffectivePolicy(
  customerId: string,
): Promise<EffectivePolicy> {
  return apiRequest<EffectivePolicy>(
    `${EMPLOYEE_CUSTOMER_PLAN_BASE_PATH}/${customerId}/plan/effective-policy`,
    { method: "GET" },
  );
}
