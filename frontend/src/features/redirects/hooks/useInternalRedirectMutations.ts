import { useMemo } from "react";
import {
  createInternalRedirect,
  deleteInternalRedirect,
  updateInternalRedirect,
} from "@services/redirectService";
import type {
  CreateInternalRedirectPayload,
  UpdateInternalRedirectPayload,
} from "@features/redirects/types/redirects.types";

export interface UseInternalRedirectMutationsResult {
  create: (payload: CreateInternalRedirectPayload) => Promise<void>;
  update: (id: string, payload: UpdateInternalRedirectPayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useInternalRedirectMutations(
  refetch: () => void,
): UseInternalRedirectMutationsResult {
  return useMemo(
    () => ({
      create: async (payload) => {
        await createInternalRedirect(payload);
        refetch();
      },
      update: async (id, payload) => {
        await updateInternalRedirect(id, payload);
        refetch();
      },
      remove: async (id) => {
        await deleteInternalRedirect(id);
        refetch();
      },
    }),
    [refetch],
  );
}
