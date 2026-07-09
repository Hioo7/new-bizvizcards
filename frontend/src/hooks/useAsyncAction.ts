import { useCallback, useState } from "react";
import { GENERIC_ASYNC_ACTION_ERROR_MESSAGE } from "@config/asyncAction";

export interface UseAsyncActionResult {
  isSubmitting: boolean;
  error: string | null;
  run: (action: () => Promise<void>, onSuccess: () => void) => Promise<void>;
  reset: () => void;
}

export function useAsyncAction(): UseAsyncActionResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<void>, onSuccess: () => void) => {
      setIsSubmitting(true);
      setError(null);
      try {
        await action();
        onSuccess();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : GENERIC_ASYNC_ACTION_ERROR_MESSAGE,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const reset = useCallback(() => setError(null), []);

  return { isSubmitting, error, run, reset };
}
