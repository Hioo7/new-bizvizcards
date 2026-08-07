import { useEffect, useState } from "react";
import { listAvailableVirtualBackgroundTemplates } from "@services/virtualBackgroundService";
import type { VirtualBackgroundTemplateSummary } from "@app-types/virtualBackground";

export interface UseVirtualBackgroundTemplatesResult {
  templates: VirtualBackgroundTemplateSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useVirtualBackgroundTemplates(): UseVirtualBackgroundTemplatesResult {
  const [templates, setTemplates] = useState<VirtualBackgroundTemplateSummary[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listAvailableVirtualBackgroundTemplates();
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

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { templates, isLoading, error };
}
