import { useCallback, useState } from "react";
import type { Ecard } from "@app-types/ecard";
import {
  createCustomerEcard,
  updateCustomerEcard,
} from "@services/customerEcardService";
import { getFieldErrorMap } from "@utils/apiFieldErrors";
import {
  buildEcardSubmission,
  ecardToBuilderState,
  getHeroValidationErrors,
  mapServerFieldErrorsToHeroFields,
} from "@features/ecards/utils/ecardFormMapping";
import { ECARD_HERO_FIELDS_INCOMPLETE_MESSAGE } from "@features/ecards/config/ecardBuilder.config";
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
  /** Hero-section field errors (client pre-check or server response), keyed by the
   * Hero sheet's own field names — null when the Hero section is currently valid. */
  heroFieldErrors: Record<string, string> | null;
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
  const [heroFieldErrors, setHeroFieldErrors] = useState<Record<string, string> | null>(
    null,
  );

  const setState = useCallback(
    (updater: (state: EcardBuilderState) => EcardBuilderState) => {
      setStateInternal(updater);
    },
    [],
  );

  const save = useCallback(async (): Promise<Ecard | null> => {
    setSaveError(null);

    const heroErrors = getHeroValidationErrors(state.hero);
    if (heroErrors) {
      setHeroFieldErrors(heroErrors);
      setSaveError(ECARD_HERO_FIELDS_INCOMPLETE_MESSAGE);
      return null;
    }

    setIsSaving(true);
    try {
      const { payload, files } = buildEcardSubmission(state);
      const saved = savedCard
        ? await updateCustomerEcard(savedCard.id, payload, files)
        : await createCustomerEcard(payload, files);
      setSavedCard(saved);
      setStateInternal(ecardToBuilderState(saved));
      setHeroFieldErrors(null);
      return saved;
    } catch (err) {
      const serverFieldErrors = getFieldErrorMap(err);
      const heroServerErrors = serverFieldErrors
        ? mapServerFieldErrorsToHeroFields(serverFieldErrors)
        : null;
      setHeroFieldErrors(heroServerErrors);
      setSaveError(
        err instanceof Error ? err.message : "Failed to save e-card.",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [savedCard, state]);

  return { state, setState, savedCard, isSaving, saveError, heroFieldErrors, save };
}
