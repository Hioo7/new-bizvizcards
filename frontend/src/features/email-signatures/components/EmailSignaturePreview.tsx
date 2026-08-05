import { useMemo } from "react";
import DOMPurify from "dompurify";
import { Mail } from "lucide-react";
import EmptyStepState from "@components/EmptyStepState";

interface EmailSignaturePreviewProps {
  html: string;
  isLoading: boolean;
  error: string | null;
}

export default function EmailSignaturePreview({
  html,
  isLoading,
  error,
}: EmailSignaturePreviewProps) {
  // Client-side defense-in-depth on top of the backend's own
  // escape-at-construction-time safety, before this ever reaches the DOM.
  const safeHtml = useMemo(() => DOMPurify.sanitize(html), [html]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-base-content/60">Live preview</p>
        {isLoading && (
          <span className="loading loading-spinner loading-xs text-base-content/40" />
        )}
      </div>
      <div className="max-h-72 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-4">
        {error && <p className="text-sm text-error">{error}</p>}
        {!error && !safeHtml && (
          <EmptyStepState
            icon={Mail}
            message="Fill in your name to see a live preview."
          />
        )}
        {!error && safeHtml && (
          <div
            className="overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        )}
      </div>
    </div>
  );
}
