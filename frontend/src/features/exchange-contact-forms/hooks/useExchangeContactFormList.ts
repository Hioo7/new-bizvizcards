import { useCallback, useEffect, useState } from "react";
import type { ExchangeContactForm } from "@app-types/exchangeContactForm";
import type { ExchangeContactFormApi } from "@features/exchange-contact-forms/types/exchangeContactFormApi.types";

export interface UseExchangeContactFormListResult {
  forms: ExchangeContactForm[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExchangeContactFormList(
  /** Must be a stable (e.g. useMemo'd) reference — it's a dependency of the
   * fetch effect below, same convention as
   * OrganisationEcardTemplateBuilderView's `loadPolicy` prop. */
  api: ExchangeContactFormApi,
): UseExchangeContactFormListResult {
  const [forms, setForms] = useState<ExchangeContactForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.list();
        if (cancelled) return;
        setForms(result);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load forms.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [api, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { forms, isLoading, error, refetch };
}
