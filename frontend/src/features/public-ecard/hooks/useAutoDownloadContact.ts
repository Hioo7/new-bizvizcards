import { useEffect, useRef } from "react";
import { ecardVCardUrl } from "@services/publicEcardService";
import type { Ecard } from "@app-types/ecard";
import { downloadFile } from "@utils/downloadFile";

/**
 * When the card owner has enabled it, automatically save a vCard for
 * whoever opens this card's public page — no manual "Save Contact" tap
 * needed. The vCard route is same-origin (proxied in dev, reverse-proxied
 * in production, per apiClient's relative-path convention), so a synthetic
 * `<a download>` click is sufficient — no blob-fetch workaround required.
 */
export function useAutoDownloadContact(card: Ecard | null): void {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!card?.hero.autoDownloadContact || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    downloadFile(ecardVCardUrl(card.endpoint), `${card.endpoint}.vcf`);
  }, [card]);
}
