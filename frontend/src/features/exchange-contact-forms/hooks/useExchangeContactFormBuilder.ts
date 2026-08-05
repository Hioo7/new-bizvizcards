import { useCallback, useEffect, useState } from "react";
import type { ExchangeContactForm } from "@app-types/exchangeContactForm";
import {
  buildExchangeContactFormFieldsPayload,
  formToBuilderState,
} from "@features/exchange-contact-forms/utils/exchangeContactFormMapping";
import {
  emptyExchangeContactFormBuilderState,
  type ExchangeContactFormBuilderState,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";
import type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";
import { EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH } from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";

export interface UseExchangeContactFormBuilderResult {
  state: ExchangeContactFormBuilderState;
  setState: (
    updater: (
      state: ExchangeContactFormBuilderState,
    ) => ExchangeContactFormBuilderState,
  ) => void;
  existingForm: ExchangeContactForm | null;
  isLoading: boolean;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
  nameError: string | null;
  forkedAt: number | null;
  save: () => Promise<ExchangeContactForm | null>;
}

export function useExchangeContactFormBuilder(
  formId: string | null,
  /** Must be a stable (e.g. useMemo'd) reference — it's a dependency of the
   * load effect below, same convention as
   * OrganisationEcardTemplateBuilderView's `loadPolicy` prop. */
  api: ExchangeContactFormApi,
): UseExchangeContactFormBuilderResult {
  const [state, setStateInternal] = useState<ExchangeContactFormBuilderState>(
    emptyExchangeContactFormBuilderState,
  );
  const [existingForm, setExistingForm] = useState<ExchangeContactForm | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(formId !== null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [forkedAt, setForkedAt] = useState<number | null>(null);

  useEffect(() => {
    if (formId === null) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const form = await api.get(formId as string);
        if (cancelled) return;
        setExistingForm(form);
        setStateInternal(formToBuilderState(form));
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load the form.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [formId, api]);

  const setState = useCallback(
    (
      updater: (
        state: ExchangeContactFormBuilderState,
      ) => ExchangeContactFormBuilderState,
    ) => {
      setStateInternal(updater);
    },
    [],
  );

  const save = useCallback(async (): Promise<ExchangeContactForm | null> => {
    setSaveError(null);
    setNameError(null);

    const trimmedName = state.name.trim();
    if (!trimmedName || trimmedName.length > EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH) {
      setNameError(
        !trimmedName
          ? "Enter a name for this form"
          : `Keep the form name under ${EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH} characters`,
      );
      return null;
    }

    setIsSaving(true);
    try {
      const fields = buildExchangeContactFormFieldsPayload(state.fields);
      if (formId) {
        const { form, forked } = await api.update(formId, {
          name: trimmedName,
          fields,
        });
        setExistingForm(form);
        setStateInternal(formToBuilderState(form));
        if (forked) {
          setForkedAt(Date.now());
        }
        return form;
      }
      const form = await api.create({ name: trimmedName, fields });
      setExistingForm(form);
      setStateInternal(formToBuilderState(form));
      return form;
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save the form.",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [api, formId, state]);

  return {
    state,
    setState,
    existingForm,
    isLoading,
    loadError,
    isSaving,
    saveError,
    nameError,
    forkedAt,
    save,
  };
}
