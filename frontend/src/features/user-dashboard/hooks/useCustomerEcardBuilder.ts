import { useCallback, useState } from "react";
import type { Ecard } from "@app-types/ecard";
import {
  createCustomerEcard,
  updateCustomerEcard,
} from "@services/customerEcardService";
import {
  buildEcardSubmission,
  ecardToBuilderState,
} from "@features/ecards/utils/ecardFormMapping";
import {
  emptyEcardBuilderState,
  emptyHeroDraft,
  type EcardBuilderState,
} from "@features/ecards/types/ecardBuilder.types";

export interface UseCustomerEcardBuilderResult {
  state: EcardBuilderState;
  setState: (updater: (state: EcardBuilderState) => EcardBuilderState) => void;
  savedCard: Ecard | null;
  isSaving: boolean;
  saveError: string | null;
  save: () => Promise<Ecard | null>;
}

export function useCustomerEcardBuilder(
  prefillName: string,
  prefillEmail: string,
  existingEcard: Ecard | null,
): UseCustomerEcardBuilderResult {
  const [state, setStateInternal] = useState<EcardBuilderState>(() =>
    existingEcard
      ? ecardToBuilderState(existingEcard)
      : {
          ...emptyEcardBuilderState(),
          hero: { ...emptyHeroDraft(), name: prefillName, email: prefillEmail },
        },
  );
  const [savedCard, setSavedCard] = useState<Ecard | null>(existingEcard);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setState = useCallback(
    (updater: (state: EcardBuilderState) => EcardBuilderState) => {
      setStateInternal(updater);
    },
    [],
  );

  const save = useCallback(async (): Promise<Ecard | null> => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const { payload, files } = buildEcardSubmission(state);
      const saved = savedCard
        ? await updateCustomerEcard(savedCard.id, payload, files)
        : await createCustomerEcard(payload, files);
      setSavedCard(saved);
      setStateInternal(ecardToBuilderState(saved));
      return saved;
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save e-card.",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [savedCard, state]);

  return { state, setState, savedCard, isSaving, saveError, save };
}
