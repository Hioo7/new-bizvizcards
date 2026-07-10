import { useMemo } from "react";
import {
  createExternalRedirect,
  deleteExternalRedirect,
  updateExternalRedirect,
} from "@services/redirectService";
import type {
  CreateExternalRedirectPayload,
  UpdateExternalRedirectPayload,
} from "@features/redirects/types/redirects.types";

export interface UseExternalRedirectMutationsResult {
  create: (payload: CreateExternalRedirectPayload) => Promise<void>;
  update: (id: string, payload: UpdateExternalRedirectPayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useExternalRedirectMutations(
  refetch: () => void,
): UseExternalRedirectMutationsResult {
  return useMemo(
    () => ({
      create: async (payload) => {
        await createExternalRedirect(payload);
        refetch();
      },
      update: async (id, payload) => {
        await updateExternalRedirect(id, payload);
        refetch();
      },
      remove: async (id) => {
        await deleteExternalRedirect(id);
        refetch();
      },
    }),
    [refetch],
  );
}
