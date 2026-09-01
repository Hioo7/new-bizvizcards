import { useEffect, useState } from "react";
import type { ValidLeadRow } from "@app-types/bulkMessenger";
import { getTemplateValidLeads } from "@services/bulkMessengerService";

export interface UseTemplateValidLeadsResult {
  rows: ValidLeadRow[];
  isLoading: boolean;
  error: string | null;
}

export function useTemplateValidLeads(
  templateId: string | null,
): UseTemplateValidLeadsResult {
  const [rows, setRows] = useState<ValidLeadRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!templateId) {
        setRows([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await getTemplateValidLeads(templateId);
        if (cancelled) return;
        setRows(result);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load recipients.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  return { rows, isLoading, error };
}
