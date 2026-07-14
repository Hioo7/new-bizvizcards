import { useCallback, useEffect, useState } from "react";
import { createEcard, getEcard, updateEcard } from "@services/ecardService";
import type { Ecard } from "@app-types/ecard";
import {
  buildEcardSubmission,
  ecardToBuilderState,
} from "@features/ecards/utils/ecardFormMapping";
import {
  emptyEcardBuilderState,
  emptyHeroDraft,
  type EcardBuilderState,
} from "@features/ecards/types/ecardBuilder.types";

export interface EcardHeroPrefill {
  name: string;
  email: string;
}

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

function createModeState(prefill: EcardHeroPrefill | null): EcardBuilderState {
  return {
    ...emptyEcardBuilderState(),
    hero: {
      ...emptyHeroDraft(),
      name: prefill?.name ?? "",
      email: prefill?.email ?? "",
    },
  };
}

export function useEcardBuilder(
  customerId: string,
  ecardId: string | null,
  prefill: EcardHeroPrefill | null,
): UseEcardBuilderResult {
  const [state, setStateInternal] = useState<EcardBuilderState>(() =>
    createModeState(prefill),
  );
  const [existingCard, setExistingCard] = useState<Ecard | null>(null);
  const [isLoading, setIsLoading] = useState(ecardId !== null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Tracks which ecardId the current `state` was last reset for, so a prop
  // change back to create mode (e.g. navigating from editing card A straight
  // to "new") can reset synchronously during render — React's documented
  // "adjust state when a prop changes" pattern — rather than via an effect,
  // since it's a pure, synchronous reset with no async work involved.
  const [resetForId, setResetForId] = useState(ecardId);
  if (ecardId !== resetForId && ecardId === null) {
    setResetForId(null);
    setExistingCard(null);
    setStateInternal(createModeState(prefill));
    setIsLoading(false);
    setLoadError(null);
  }

  useEffect(() => {
    if (ecardId === null) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const card = await getEcard(ecardId as string);
        if (cancelled) return;
        setExistingCard(card);
        setStateInternal(ecardToBuilderState(card));
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
  }, [ecardId]);

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
      const saved = ecardId
        ? await updateEcard(ecardId, payload, files)
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
  }, [customerId, ecardId, state]);

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
