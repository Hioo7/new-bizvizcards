import { useEffect, useState } from "react";
import type { ExchangeContactForm } from "@app-types/exchangeContactForm";
import { listMyExchangeContactForms } from "@services/customerExchangeContactFormService";

export interface UseMyExchangeContactFormsResult {
  forms: Pick<ExchangeContactForm, "id" | "name">[];
  isLoading: boolean;
  error: string | null;
}

// The customer's own exchange contact forms, for the template's optional
// linked-form picker.
export function useMyExchangeContactForms(): UseMyExchangeContactFormsResult {
  const [forms, setForms] = useState<
    Pick<ExchangeContactForm, "id" | "name">[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listMyExchangeContactForms();
        if (cancelled) return;
        setForms(result.map((form) => ({ id: form.id, name: form.name })));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load forms.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { forms, isLoading, error };
}
