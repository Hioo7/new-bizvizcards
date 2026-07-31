import { useCallback, useEffect, useState } from "react";
import type { OrganisationEcardTemplate } from "@app-types/organisationEcardTemplate";
import {
  buildOrganisationEcardTemplateSubmission,
  organisationEcardTemplateToBuilderState,
} from "@features/organisation-ecard-template/utils/organisationEcardTemplateFormMapping";
import {
  emptyOrganisationEcardTemplateBuilderState,
  type OrganisationEcardTemplateBuilderApi,
  type OrganisationEcardTemplateBuilderState,
} from "@features/organisation-ecard-template/types/organisationEcardTemplateBuilder.types";

export interface UseOrganisationEcardTemplateBuilderResult {
  state: OrganisationEcardTemplateBuilderState;
  setState: (
    updater: (
      state: OrganisationEcardTemplateBuilderState,
    ) => OrganisationEcardTemplateBuilderState,
  ) => void;
  isLoading: boolean;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
  save: () => Promise<OrganisationEcardTemplate | null>;
  templateExists: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  remove: () => Promise<boolean>;
}

// `api` is expected to be a stable reference (a module-level constant, not an
// object literal recreated per render) — its identity drives the load effect
// below, same as `organisationId`.
export function useOrganisationEcardTemplateBuilder(
  organisationId: string,
  api: OrganisationEcardTemplateBuilderApi,
): UseOrganisationEcardTemplateBuilderResult {
  const [state, setStateInternal] = useState<OrganisationEcardTemplateBuilderState>(
    emptyOrganisationEcardTemplateBuilderState,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
        setStateInternal(organisationEcardTemplateToBuilderState(template));
        setTemplateExists(template !== null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "Failed to load the e-card template.",
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
        state: OrganisationEcardTemplateBuilderState,
      ) => OrganisationEcardTemplateBuilderState,
    ) => {
      setStateInternal(updater);
    },
    [],
  );

  const save = useCallback(async (): Promise<OrganisationEcardTemplate | null> => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const { payload, files } = buildOrganisationEcardTemplateSubmission(state);
      const saved = await api.update(organisationId, payload, files);
      setStateInternal(organisationEcardTemplateToBuilderState(saved));
      setTemplateExists(true);
      return saved;
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to save the e-card template.",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [organisationId, api, state]);

  const remove = useCallback(async (): Promise<boolean> => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(organisationId);
      setStateInternal(emptyOrganisationEcardTemplateBuilderState());
      setTemplateExists(false);
      return true;
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to remove the e-card policy.",
      );
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [organisationId, api]);

  return {
    state,
    setState,
    isLoading,
    loadError,
    isSaving,
    saveError,
    save,
    templateExists,
    isDeleting,
    deleteError,
    remove,
  };
}
