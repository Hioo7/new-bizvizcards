import { useCallback, useEffect, useState } from "react";
import type { ExchangeContactForm } from "@app-types/exchangeContactForm";
import {
  buildExchangeContactFormFieldsPayload,
  emptyExchangeContactFormBuilderState,
  formToBuilderState,
  type ExchangeContactFormBuilderState,
} from "@features/exchange-contact-forms";
import { EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH } from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
import type { OrganisationExchangeContactFormTemplateBuilderApi } from "@features/organisation-exchange-contact-form-template/types/organisationExchangeContactFormTemplateBuilder.types";

export interface UseOrganisationExchangeContactFormTemplateBuilderResult {
  state: ExchangeContactFormBuilderState;
  setState: (
    updater: (
      state: ExchangeContactFormBuilderState,
    ) => ExchangeContactFormBuilderState,
  ) => void;
  isLoading: boolean;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
  nameError: string | null;
  forkedAt: number | null;
  save: () => Promise<ExchangeContactForm | null>;
  templateExists: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  remove: () => Promise<boolean>;
}

export function useOrganisationExchangeContactFormTemplateBuilder(
  organisationId: string,
  /** Must be a stable (e.g. useMemo'd) reference — it's a dependency of the
   * load effect below. */
  api: OrganisationExchangeContactFormTemplateBuilderApi,
): UseOrganisationExchangeContactFormTemplateBuilderResult {
  const [state, setStateInternal] = useState<ExchangeContactFormBuilderState>(
    emptyExchangeContactFormBuilderState,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [forkedAt, setForkedAt] = useState<number | null>(null);
  const [templateExists, setTemplateExists] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const template = await api.get(organisationId);
        if (cancelled) return;
        setStateInternal(
          template
            ? formToBuilderState(template)
            : emptyExchangeContactFormBuilderState(),
        );
        setTemplateExists(template !== null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "Failed to load the form template.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [organisationId, api]);

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
          ? "Enter a name for this template"
          : `Keep the template name under ${EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH} characters`,
      );
      return null;
    }

    setIsSaving(true);
    try {
      const fields = buildExchangeContactFormFieldsPayload(state.fields);
      const { form, forked } = await api.upsert(organisationId, {
        name: trimmedName,
        fields,
      });
      setStateInternal(formToBuilderState(form));
      setTemplateExists(true);
      if (forked) {
        setForkedAt(Date.now());
      }
      return form;
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to save the form template.",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [api, organisationId, state]);

  const remove = useCallback(async (): Promise<boolean> => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(organisationId);
      setStateInternal(emptyExchangeContactFormBuilderState());
      setTemplateExists(false);
      return true;
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to remove the form template.",
      );
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [api, organisationId]);

  return {
    state,
    setState,
    isLoading,
    loadError,
    isSaving,
    saveError,
    nameError,
    forkedAt,
    save,
    templateExists,
    isDeleting,
    deleteError,
    remove,
  };
}
