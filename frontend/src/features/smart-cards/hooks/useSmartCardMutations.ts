import { useMemo } from "react";
import {
  createSmartCard,
  deleteSmartCard,
  updateSmartCard,
} from "@services/smartCardService";
import type {
  CreateSmartCardPayload,
  SmartCard,
  SmartCardImageUpload,
  SmartCardTemplateKey,
  UpdateSmartCardPayload,
} from "@app-types/smartCard";

export interface UseSmartCardMutationsResult {
  create: (
    payload: CreateSmartCardPayload,
    files: SmartCardImageUpload[],
  ) => Promise<SmartCard>;
  update: (
    id: string,
    payload: UpdateSmartCardPayload,
    files: SmartCardImageUpload[],
  ) => Promise<SmartCard>;
  remove: (id: string) => Promise<void>;
}

export function useSmartCardMutations(
  templateKey: SmartCardTemplateKey,
  refetch: () => void,
): UseSmartCardMutationsResult {
  return useMemo(
    () => ({
      create: async (payload, files) => {
        const card = await createSmartCard(templateKey, payload, files);
        refetch();
        return card;
      },
      update: async (id, payload, files) => {
        const card = await updateSmartCard(templateKey, id, payload, files);
        refetch();
        return card;
      },
      remove: async (id) => {
        await deleteSmartCard(templateKey, id);
        refetch();
      },
    }),
    [templateKey, refetch],
  );
}
