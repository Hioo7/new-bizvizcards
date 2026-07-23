import { useCallback, useEffect, useState } from "react";
import type { Ecard } from "@app-types/ecard";
import {
  createCustomerEcard,
  updateCustomerEcard,
} from "@services/customerEcardService";
import { getPublicEcard } from "@services/publicEcardService";
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
  isLoading: boolean;
  loadError: string | null;
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
  // Start loading whenever we have an existing card to fetch full data for
  const [isLoading, setIsLoading] = useState(existingEcard !== null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch the full card (with all components) via the public endpoint.
  // The list endpoint omits components for performance, so we use the existing
  // public ecard API — no new backend endpoint needed.
  useEffect(() => {
    if (!existingEcard) return;

    let cancelled = false;

    async function fetchFull() {
      if (!existingEcard) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const { card } = await getPublicEcard(existingEcard.endpoint);
        if (cancelled) return;
        setSavedCard(card);
        setStateInternal(ecardToBuilderState(card));
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load e-card.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchFull();

    return () => {
      cancelled = true;
    };
  // Re-run when the target ecard changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingEcard?.id]);

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

  return {
    state,
    setState,
    savedCard,
    isLoading,
    loadError,
    isSaving,
    saveError,
    save,
  };
}
