import { useEffect } from "react";
import type { PublicSmartCard } from "@app-types/smartCard";
import { getSmartCardPreviewMeta } from "@features/public-smart-card/utils/getSmartCardPreviewMeta";

const DESCRIPTION_META_SELECTOR = 'meta[name="description"]';

/** Sets the browser tab title/description for a loaded public smart card — a
 * real-user UX touch, independent of the server-rendered Open Graph tags
 * crawlers see (those are generated backend-side and never reach this SPA). */
export function useSmartCardDocumentMeta(card: PublicSmartCard | null): void {
  useEffect(() => {
    if (!card) return;

    const { title, description } = getSmartCardPreviewMeta(card);
    const previousTitle = document.title;
    document.title = title;

    let descriptionTag = document.querySelector(DESCRIPTION_META_SELECTOR);
    const createdDescriptionTag = !descriptionTag;
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    const previousDescription = descriptionTag.getAttribute("content");
    descriptionTag.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (createdDescriptionTag) {
        descriptionTag?.remove();
      } else if (previousDescription !== null) {
        descriptionTag?.setAttribute("content", previousDescription);
      }
    };
  }, [card]);
}
