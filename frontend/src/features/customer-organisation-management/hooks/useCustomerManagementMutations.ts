import { useMemo } from "react";
import {
  banCustomer,
  createCustomer,
  setCustomerPassword,
  unbanCustomer,
  updateCustomer,
} from "@services/customerService";
import type {
  BanCustomerPayload,
  CreateCustomerPayload,
  SetCustomerPasswordPayload,
  UpdateCustomerPayload,
} from "@app-types/customer";

export interface UseCustomerManagementMutationsResult {
  createCustomer: (payload: CreateCustomerPayload) => Promise<void>;
  updateCustomer: (
    id: string,
    payload: UpdateCustomerPayload,
  ) => Promise<void>;
  setCustomerPassword: (
    id: string,
    payload: SetCustomerPasswordPayload,
  ) => Promise<void>;
  banCustomer: (id: string, payload: BanCustomerPayload) => Promise<void>;
  unbanCustomer: (id: string) => Promise<void>;
}

export function useCustomerManagementMutations(
  refetch: () => void,
): UseCustomerManagementMutationsResult {
  return useMemo(
    () => ({
      createCustomer: async (payload) => {
        await createCustomer(payload);
        refetch();
      },
      updateCustomer: async (id, payload) => {
        await updateCustomer(id, payload);
        refetch();
      },
      setCustomerPassword: async (id, payload) => {
        await setCustomerPassword(id, payload);
        refetch();
      },
      banCustomer: async (id, payload) => {
        await banCustomer(id, payload);
        refetch();
      },
      unbanCustomer: async (id) => {
        await unbanCustomer(id);
        refetch();
      },
    }),
    [refetch],
  );
}
