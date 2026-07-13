import { useCallback, useEffect, useState } from "react";
import { createEcard, listEcards, updateEcard } from "@services/ecardService";
import type { Ecard } from "@app-types/ecard";
import {
  buildEcardSubmission,
  ecardToBuilderState,
} from "@features/ecards/utils/ecardFormMapping";
import {
  emptyEcardBuilderState,
  type EcardBuilderState,
} from "@features/ecards/types/ecardBuilder.types";

export interface UseEcardBuilderResult {
  state: EcardBuilderState;
  setState: (updater: (state: EcardBuilderState) => EcardBuilderState) => void;
  existingCard: Ecard | null;
  isLoading: boolean;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
  save: () => Promise<Ecard | null>;
}

export function useEcardBuilder(customerId: string): UseEcardBuilderResult {
  const [state, setStateInternal] = useState<EcardBuilderState>(
    emptyEcardBuilderState(),
  );
  const [existingCard, setExistingCard] = useState<Ecard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await listEcards({ customerId, page: 1, pageSize: 1 });
        if (cancelled) return;
        const card = response.ecards[0] ?? null;
        setExistingCard(card);
        setStateInternal(card ? ecardToBuilderState(card) : emptyEcardBuilderState());
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load the e-card.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

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
      const saved = existingCard
        ? await updateEcard(existingCard.id, payload, files)
        : await createEcard({ ...payload, customerId }, files);
      setExistingCard(saved);
      setStateInternal(ecardToBuilderState(saved));
      return saved;
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save the e-card.",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [customerId, existingCard, state]);

  return {
    state,
    setState,
    existingCard,
    isLoading,
    loadError,
    isSaving,
    saveError,
    save,
  };
}
