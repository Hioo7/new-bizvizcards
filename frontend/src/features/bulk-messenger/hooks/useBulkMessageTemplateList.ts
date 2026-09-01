import { useCallback, useEffect, useState } from "react";
import type { BulkMessageTemplateSummary } from "@app-types/bulkMessenger";
import { listBulkMessageTemplates } from "@services/bulkMessengerService";

export interface UseBulkMessageTemplateListResult {
  templates: BulkMessageTemplateSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBulkMessageTemplateList(): UseBulkMessageTemplateListResult {
  const [templates, setTemplates] = useState<BulkMessageTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listBulkMessageTemplates();
        if (cancelled) return;
        setTemplates(result);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load templates.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { templates, isLoading, error, refetch };
}
