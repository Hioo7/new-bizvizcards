import { useMemo } from "react";
import {
  createRestrictedPath,
  deleteRestrictedPath,
} from "@services/redirectService";
import type { CreateRestrictedPathPayload } from "@features/redirects/types/redirects.types";

export interface UseRestrictedPathMutationsResult {
  create: (payload: CreateRestrictedPathPayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useRestrictedPathMutations(
  refetch: () => void,
): UseRestrictedPathMutationsResult {
  return useMemo(
    () => ({
      create: async (payload) => {
        await createRestrictedPath(payload);
        refetch();
      },
      remove: async (id) => {
        await deleteRestrictedPath(id);
        refetch();
      },
    }),
    [refetch],
  );
}
