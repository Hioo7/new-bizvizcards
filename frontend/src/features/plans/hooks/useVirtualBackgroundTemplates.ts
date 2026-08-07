import { useCallback, useEffect, useState } from "react";
import { listVirtualBackgroundTemplates } from "@services/virtualBackgroundTemplateService";
import type { VirtualBackgroundTemplateSummary } from "@app-types/virtualBackground";

export interface UseVirtualBackgroundTemplatesResult {
  templates: VirtualBackgroundTemplateSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVirtualBackgroundTemplates(): UseVirtualBackgroundTemplatesResult {
  const [templates, setTemplates] = useState<VirtualBackgroundTemplateSummary[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listVirtualBackgroundTemplates();
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
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { templates, isLoading, error, refetch };
}
