import { useEffect, useMemo, useState } from "react";
import type {
  FormPlaceholderOption,
  PlaceholderOption,
} from "@app-types/bulkMessenger";
import { getBulkMessagePlaceholders } from "@services/bulkMessengerService";

export interface UseTemplatePlaceholdersResult {
  core: PlaceholderOption[];
  formFields: FormPlaceholderOption[];
  availableTokens: Set<string>;
  isLoading: boolean;
  error: string | null;
}

// Fetches the placeholder set for a template body, re-fetching whenever the
// linked form selection changes.
export function useTemplatePlaceholders(
  formId: string | null,
): UseTemplatePlaceholdersResult {
  const [core, setCore] = useState<PlaceholderOption[]>([]);
  const [formFields, setFormFields] = useState<FormPlaceholderOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getBulkMessagePlaceholders(formId);
        if (cancelled) return;
        setCore(result.core);
        setFormFields(result.formFields);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load placeholders.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [formId]);

  const availableTokens = useMemo(
    () =>
      new Set(
        [...core, ...formFields].map((option) => option.token.toLowerCase()),
      ),
    [core, formFields],
  );

  return { core, formFields, availableTokens, isLoading, error };
}
