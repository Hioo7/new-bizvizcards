import { useCallback, useEffect, useState } from "react";
import type { EmailSignature } from "@app-types/emailSignature";
import { listMyEmailSignatures } from "@services/emailSignatureService";

export interface UseEmailSignatureListResult {
  signatures: EmailSignature[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEmailSignatureList(): UseEmailSignatureListResult {
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listMyEmailSignatures();
        if (cancelled) return;
        setSignatures(result);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load email signatures.",
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

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { signatures, isLoading, error, refetch };
}
