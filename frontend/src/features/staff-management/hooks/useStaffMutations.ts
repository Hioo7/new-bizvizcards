import { useMemo } from "react";
import {
  banStaff,
  createStaff,
  deleteStaff,
  setStaffRole,
  unbanStaff,
  updateStaffName,
} from "@services/staffManagementService";
import type {
  BanStaffPayload,
  CreateStaffPayload,
  SetStaffRolePayload,
  UpdateStaffNamePayload,
} from "@app-types/staffAuth";

export interface UseStaffMutationsResult {
  createStaff: (payload: CreateStaffPayload) => Promise<void>;
  updateStaffName: (id: string, payload: UpdateStaffNamePayload) => Promise<void>;
  setStaffRole: (id: string, payload: SetStaffRolePayload) => Promise<void>;
  banStaff: (id: string, payload: BanStaffPayload) => Promise<void>;
  unbanStaff: (id: string) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
}

export function useStaffMutations(refetch: () => void): UseStaffMutationsResult {
  return useMemo(
    () => ({
      createStaff: async (payload) => {
        await createStaff(payload);
        refetch();
      },
      updateStaffName: async (id, payload) => {
        await updateStaffName(id, payload);
        refetch();
      },
      setStaffRole: async (id, payload) => {
        await setStaffRole(id, payload);
        refetch();
      },
      banStaff: async (id, payload) => {
        await banStaff(id, payload);
        refetch();
      },
      unbanStaff: async (id) => {
        await unbanStaff(id);
        refetch();
      },
      deleteStaff: async (id) => {
        await deleteStaff(id);
        refetch();
      },
    }),
    [refetch],
  );
}
