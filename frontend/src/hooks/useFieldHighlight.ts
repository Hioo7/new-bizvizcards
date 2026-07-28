import { useCallback, useEffect, useRef, useState } from "react";
import { FIELD_ERROR_HIGHLIGHT_DURATION_MS } from "@config/formFieldErrors.config";

export interface UseFieldHighlightResult {
  highlightedField: string | null;
  triggerHighlight: (field: string) => void;
  clearHighlight: () => void;
}

/** Drives a brief, self-clearing attention highlight (e.g. a pulsing ring) on a single
 * form field — separate from the field's own validation error, which persists until fixed. */
export function useFieldHighlight(): UseFieldHighlightResult {
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearHighlight = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHighlightedField(null);
  }, []);

  const triggerHighlight = useCallback((field: string) => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setHighlightedField(field);
    timeoutRef.current = window.setTimeout(() => {
      setHighlightedField(null);
      timeoutRef.current = null;
    }, FIELD_ERROR_HIGHLIGHT_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return { highlightedField, triggerHighlight, clearHighlight };
}
