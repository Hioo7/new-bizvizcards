import { useEffect, useMemo, useState } from "react";
import type { ImageFieldValue } from "@app-types/media.types";
import { previewMyEmailSignature } from "@services/emailSignatureService";
import { EMAIL_SIGNATURE_PREVIEW_DEBOUNCE_MS } from "@features/email-signatures/config/emailSignatureBuilder.config";
import { buildEmailSignaturePreviewPayload } from "@features/email-signatures/utils/emailSignatureDraft.util";
import type { EmailSignatureDraft } from "@features/email-signatures/types/emailSignatureDraft";

export interface UseEmailSignaturePreviewResult {
  html: string;
  isLoading: boolean;
  error: string | null;
}

function useImagePreviewUrl(value: ImageFieldValue): string | undefined {
  const objectUrl = useMemo(
    () => (value.file ? URL.createObjectURL(value.file) : null),
    [value.file],
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);
  return objectUrl ?? value.existingUrl ?? undefined;
}

/** Debounced live preview — calls the real backend renderer (not a separate
 * React mockup) so what's shown here is pixel-identical to the exported
 * signature. */
export function useEmailSignaturePreview(
  draft: EmailSignatureDraft,
): UseEmailSignaturePreviewResult {
  const profileImageUrl = useImagePreviewUrl(draft.profileImage);
  const companyLogoUrl = useImagePreviewUrl(draft.companyLogo);
  const bannerImageUrl = useImagePreviewUrl(draft.bannerImage);
  const hasFullName = draft.fullName.trim().length > 0;

  const [html, setHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFullName) return;

    let cancelled = false;

    async function run() {
      setIsLoading(true);
      try {
        const payload = buildEmailSignaturePreviewPayload(draft, {
          profileImageUrl,
          companyLogoUrl,
          bannerImageUrl,
        });
        const result = await previewMyEmailSignature(payload);
        if (cancelled) return;
        setHtml(result.html);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to render preview.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const timeoutId = setTimeout(
      () => void run(),
      EMAIL_SIGNATURE_PREVIEW_DEBOUNCE_MS,
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [draft, hasFullName, profileImageUrl, companyLogoUrl, bannerImageUrl]);

  return {
    html: hasFullName ? html : "",
    isLoading: hasFullName && isLoading,
    error: hasFullName ? error : null,
  };
}
