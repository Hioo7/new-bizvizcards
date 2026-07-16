import { useEffect, useState } from "react";
import { listSmartCardTemplates } from "@services/smartCardTemplateService";
import type { SmartCardTemplateSummary } from "@app-types/smartCardTemplate";

export interface UseSmartCardTemplatesResult {
  templates: SmartCardTemplateSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useSmartCardTemplates(): UseSmartCardTemplatesResult {
  const [templates, setTemplates] = useState<SmartCardTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listSmartCardTemplates();
        if (!cancelled) setTemplates(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load templates.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  return { templates, isLoading, error };
}
