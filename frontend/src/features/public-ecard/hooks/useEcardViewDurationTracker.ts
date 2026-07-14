import { useEffect, useRef } from "react";
import { reportEcardViewDuration } from "@services/publicEcardService";

/** Times how long a visitor spends on the public e-card page and reports the
 * elapsed duration back once, when they leave. Listens for both
 * `visibilitychange` (tab hidden) and `pagehide` — no single event reliably
 * fires across all browsers/situations (notably iOS Safari) on
 * tab-close/navigate-away, so both are wired and the report is idempotent. */
export function useEcardViewDurationTracker(
  endpoint: string | undefined,
  viewEventId: string | null,
): void {
  const startedAtRef = useRef<number | null>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!endpoint || !viewEventId) return;

    startedAtRef.current = performance.now();
    reportedRef.current = false;

    function reportDuration() {
      if (reportedRef.current || startedAtRef.current === null) return;
      reportedRef.current = true;
      const durationMs = Math.round(performance.now() - startedAtRef.current);
      void reportEcardViewDuration(endpoint as string, viewEventId as string, durationMs);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") reportDuration();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", reportDuration);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", reportDuration);
      reportDuration();
    };
  }, [endpoint, viewEventId]);
}
